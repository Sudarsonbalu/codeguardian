import asyncio
import os
import shlex
import sys
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import subprocess

router = APIRouter(prefix="/terminal", tags=["terminal"])

# Session storage for active terminal processes
active_processes: Dict[str, subprocess.Popen] = {}

class TerminalSessionManager:
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.process = None

    async def start(self):
        # Determine appropriate shell
        if sys.platform == "win32":
            shell_cmd = ["powershell.exe", "-NoLogo", "-NoExit"]
        else:
            shell_cmd = ["/bin/bash"]

        try:
            self.process = subprocess.Popen(
                shell_cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=0,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
            )
            active_processes[self.session_id] = self.process
        except Exception as e:
            await self.websocket.send_text(f"\r\nFailed to start terminal: {str(e)}\r\n")
            return

        # Start background reader task
        asyncio.create_task(self.read_stdout())

    async def read_stdout(self):
        loop = asyncio.get_running_loop()
        try:
            while self.process and self.process.poll() is None:
                # Read output in non-blocking way using thread pool executor
                line = await loop.run_in_executor(None, self.process.stdout.read, 1024)
                if not line:
                    break
                await self.websocket.send_text(line)
        except Exception as e:
            pass
        finally:
            await self.websocket.send_text("\r\nTerminal session ended.\r\n")

    def write_input(self, data: str):
        if self.process and self.process.stdin:
            try:
                self.process.stdin.write(data)
                self.process.stdin.flush()
            except Exception:
                pass

    def terminate(self):
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass
            self.process = None
        if self.session_id in active_processes:
            del active_processes[self.session_id]

@router.websocket("/ws/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    manager = TerminalSessionManager(websocket, session_id)
    await manager.start()

    try:
        while True:
            data = await websocket.receive_text()
            manager.write_input(data)
    except WebSocketDisconnect:
        pass
    finally:
        manager.terminate()
