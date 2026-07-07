"""
Performance Agent — Detects N+1 queries, inefficient algorithms,
memory leaks, missing caching, blocking I/O, and complexity issues.
"""
from __future__ import annotations
import re
from typing import Dict, Any


class PerformanceAgent:
    AGENT_NAME = "Performance Agent"
    AGENT_ICON = "⚡"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            # N+1 query pattern: DB query inside loop
            if language.lower() == "python":
                in_loop = any(
                    re.match(r'^(for |while )', lines[i].strip())
                    for i in range(max(0, idx - 5), idx)
                )
                if in_loop and re.search(r'\.(query|filter|get|execute|find)\(', stripped):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="error", confidence=0.88,
                        message="N+1 query detected: database query inside a loop.",
                        suggestion="Use bulk queries: `db.query(Model).filter(Model.id.in_(ids)).all()` or eager loading with `.options(joinedload(...))`.",
                        impact="Exponential DB calls. 100 items = 101 queries. Causes severe latency at scale."
                    ))

            # String concatenation in loops (Python)
            if language.lower() == "python":
                if re.match(r'^(for |while )', stripped):
                    loop_body = "\n".join(lines[idx:idx + 10])
                    if re.search(r'\w+\s*\+=\s*["\']|\w+\s*=\s*\w+\s*\+\s*["\']', loop_body):
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="warning", confidence=0.82,
                            message="String concatenation inside loop creates O(n²) memory allocations.",
                            suggestion="Use `''.join(parts_list)` or an `io.StringIO` buffer to build strings efficiently.",
                            impact="Performance degrades quadratically. Causes GC pressure and high memory usage."
                        ))

            # Synchronous sleep / blocking I/O
            if re.search(r'\btime\.sleep\b', stripped) or re.search(r'\bThread\.sleep\b', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.90,
                    message="Blocking sleep detected. Blocks the entire thread/event loop.",
                    suggestion="Use async alternatives: `await asyncio.sleep(n)` in async contexts, or message queues for delays.",
                    impact="Reduces throughput. In async code, blocks event loop causing all requests to stall."
                ))

            # Missing pagination / LIMIT in SQL
            if re.search(r'SELECT\s+\*\s+FROM', stripped, re.IGNORECASE) and \
               "LIMIT" not in stripped.upper() and "limit" not in "\n".join(lines[idx:idx+3]).lower():
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.78,
                    message="`SELECT *` without LIMIT may return unbounded result sets.",
                    suggestion="Add `LIMIT` and `OFFSET` for pagination. Select only required columns instead of `*`.",
                    impact="Fetching millions of rows can exhaust memory and cause timeouts."
                ))

            # Nested loops O(n²)
            if re.match(r'^(for |while )', stripped):
                inner_block = "\n".join(lines[idx + 1: idx + 20])
                if re.search(r'^\s+(for |while )', inner_block, re.MULTILINE):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="info", confidence=0.65,
                        message="Nested loop detected — potential O(n²) or higher time complexity.",
                        suggestion="Consider using hash maps/sets for lookups, or vectorized operations (NumPy). Profile before optimizing.",
                        impact="Nested loops over large datasets cause exponential slowdowns."
                    ))

            # Global variable access in hot path
            if language.lower() == "python" and re.match(r'^global\s+', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.72,
                    message="Global variable access is slower than local variable access in Python.",
                    suggestion="Assign global to a local variable at the start of the function for hot paths.",
                    impact="Minor but measurable slowdown in tight loops due to global namespace lookup."
                ))

            # React: missing key in list render
            if language.lower() in ["javascript", "typescript", "typescriptreact"]:
                if ".map(" in stripped and "key=" not in "\n".join(lines[idx:idx + 5]):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.85,
                        message="React list rendering without `key` prop causes full list re-renders.",
                        suggestion="Add unique `key` prop to each list item: `<Item key={item.id} .../>`. Use stable IDs, not array index.",
                        impact="React cannot optimize DOM diffing without keys — entire list re-renders on any change."
                    ))

        summary = f"Performance Agent found {len(issues)} performance issues including algorithmic complexity and resource inefficiencies."
        score_penalty = len(issues) * 5
        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(65, 100 - score_penalty),
            "issue_count": len(issues),
        }

    def _issue(self, file_path, line_number, line_content, severity, confidence, message, suggestion, impact):
        return {
            "file_path": file_path, "line_number": line_number, "line_content": line_content,
            "severity": severity, "category": "performance", "agent_name": self.AGENT_NAME,
            "confidence_score": confidence, "message": message, "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "python": "py", "java": "java", "go": "go"}.get(lang.lower(), "txt")
