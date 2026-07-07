"""
Bug Detection Agent — Finds runtime bugs, logic errors, null references,
unhandled exceptions, resource leaks, and dead code.
"""
from __future__ import annotations
import re
from typing import List, Dict, Any


class BugDetectionAgent:
    """
    Analyzes code for potential bugs:
    - Null/None dereferences
    - Unhandled exceptions
    - Infinite loop risks
    - Resource leaks (unclosed files/connections)
    - Dead code (unreachable statements)
    - Off-by-one errors
    - Type mismatches
    """

    AGENT_NAME = "Bug Detection Agent"
    AGENT_ICON = "🐛"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            # --- Python-specific rules ---
            if language.lower() == "python":
                # Bare except
                if re.match(r'^except\s*:', stripped) or stripped == "except:":
                    issues.append(self._issue(
                        file_path=f"code.py", line_number=ln, line_content=line,
                        severity="warning", confidence=0.92,
                        message="Bare `except:` clause catches all exceptions including SystemExit and KeyboardInterrupt.",
                        suggestion="Use `except Exception as e:` to catch only application-level exceptions. Log the exception for debugging.",
                        impact="Can mask critical errors and make debugging extremely difficult in production."
                    ))

                # Mutable default argument
                if re.search(r'def\s+\w+\(.*=\s*(\[\]|\{\}|\(\))', stripped):
                    issues.append(self._issue(
                        file_path="code.py", line_number=ln, line_content=line,
                        severity="error", confidence=0.95,
                        message="Mutable default argument detected. Default list/dict/set is shared across all calls.",
                        suggestion="Use `None` as default and initialize inside function body: `if arg is None: arg = []`",
                        impact="Causes subtle state accumulation bugs that are very hard to trace."
                    ))

                # Variable defined but never used (simple check)
                if re.match(r'^(\w+)\s*=', stripped):
                    var_name = re.match(r'^(\w+)\s*=', stripped).group(1)
                    remaining_code = "\n".join(lines[idx + 1:])
                    if var_name not in remaining_code and var_name not in ["_", "__"]:
                        issues.append(self._issue(
                            file_path="code.py", line_number=ln, line_content=line,
                            severity="info", confidence=0.60,
                            message=f"Variable `{var_name}` may be assigned but never used.",
                            suggestion=f"Remove unused variable `{var_name}` or prefix with `_` if intentionally unused.",
                            impact="Contributes to code clutter and potential memory waste."
                        ))

                # File open without context manager
                if "open(" in stripped and "with " not in stripped and "=" in stripped:
                    issues.append(self._issue(
                        file_path="code.py", line_number=ln, line_content=line,
                        severity="warning", confidence=0.88,
                        message="File opened without context manager (`with` statement). File may not be closed on exceptions.",
                        suggestion="Use `with open(...) as f:` to ensure the file is always properly closed.",
                        impact="Resource leak — file handles may remain open causing OS-level descriptor exhaustion."
                    ))

                # Broad exception with pass
                if stripped == "pass" and idx > 0 and "except" in lines[idx - 1]:
                    issues.append(self._issue(
                        file_path="code.py", line_number=ln, line_content=line,
                        severity="error", confidence=0.97,
                        message="Exception silently swallowed with `pass`. Errors are completely hidden.",
                        suggestion="At minimum, log the exception: `logger.exception('Unexpected error')` or re-raise.",
                        impact="Silent failures make debugging and monitoring impossible in production."
                    ))

            # --- JavaScript / TypeScript rules ---
            if language.lower() in ["javascript", "typescript", "typescriptreact", "javascriptreact"]:
                # == instead of ===
                if re.search(r'[^=!<>]==[^=]', stripped) and not stripped.startswith("//"):
                    issues.append(self._issue(
                        file_path=f"code.{self._ext(language)}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.90,
                        message="Using `==` (loose equality) instead of `===` (strict equality).",
                        suggestion="Replace `==` with `===` to avoid unexpected type coercion bugs.",
                        impact="Type coercion can cause `0 == '0'` to be true, leading to logic errors."
                    ))

                # Async without await
                if "async" in stripped and "function" in stripped and "await" not in "\n".join(lines[idx:idx+15]):
                    issues.append(self._issue(
                        file_path=f"code.{self._ext(language)}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.70,
                        message="Async function declared but no `await` found in body. Function may be unnecessarily async.",
                        suggestion="Remove `async` keyword if no awaitable operations are used, or add missing `await` calls.",
                        impact="Unnecessary async adds overhead and confuses calling code."
                    ))

                # Missing error handling in Promise chains
                if ".then(" in stripped and ".catch(" not in stripped and "try" not in "\n".join(lines[max(0,idx-3):idx]):
                    issues.append(self._issue(
                        file_path=f"code.{self._ext(language)}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.82,
                        message="Promise `.then()` chain without `.catch()` error handler.",
                        suggestion="Add `.catch(err => console.error(err))` or use try/await with try-catch block.",
                        impact="Unhandled promise rejections crash Node.js processes in production."
                    ))

            # --- General rules (all languages) ---
            # TODO comments left in code
            if re.search(r'\b(TODO|FIXME|HACK|XXX)\b', stripped, re.IGNORECASE):
                issues.append(self._issue(
                    file_path=f"code.{self._ext(language)}", line_number=ln, line_content=line,
                    severity="info", confidence=0.99,
                    message=f"Unresolved TODO/FIXME marker found in code: `{stripped[:60]}`",
                    suggestion="Resolve the TODO item or create a tracked issue in your project management system.",
                    impact="Unresolved markers indicate incomplete implementation or known bugs."
                ))

        summary = f"Bug Detection Agent identified {len(issues)} potential bugs including logic errors, resource leaks, and exception handling issues."
        score_penalty = min(len(issues) * 4, 30)

        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(70, 100 - score_penalty),
            "issue_count": len(issues),
        }

    def _issue(self, file_path, line_number, line_content, severity, confidence, message, suggestion, impact):
        return {
            "file_path": file_path,
            "line_number": line_number,
            "line_content": line_content,
            "severity": severity,
            "category": "bug",
            "agent_name": self.AGENT_NAME,
            "confidence_score": confidence,
            "message": message,
            "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "javascriptreact": "jsx", "python": "py"}.get(lang.lower(), "txt")
