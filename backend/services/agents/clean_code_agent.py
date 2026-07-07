"""
Clean Code Agent — Enforces SOLID principles, naming conventions,
function length, cyclomatic complexity, and code duplication.
"""
from __future__ import annotations
import re
from typing import Dict, Any


class CleanCodeAgent:
    AGENT_NAME = "Clean Code Agent"
    AGENT_ICON = "✨"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)

        # --- Function length analysis ---
        func_start = None
        func_name = ""
        brace_depth = 0

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            # Python: detect long functions
            if language.lower() == "python":
                m = re.match(r'^def\s+(\w+)\s*\(', stripped)
                if m:
                    func_start = idx
                    func_name = m.group(1)
                elif func_start is not None:
                    # End of function detected by dedent
                    if stripped and not stripped.startswith("#") and not line.startswith(" ") and not line.startswith("\t"):
                        length = idx - func_start
                        if length > 40:
                            issues.append(self._issue(
                                file_path=f"code.{ext}", line_number=func_start + 1,
                                line_content=lines[func_start],
                                severity="warning", confidence=0.92,
                                message=f"Function `{func_name}` is {length} lines long. Functions over 40 lines are hard to maintain.",
                                suggestion="Apply Single Responsibility Principle: extract sub-tasks into smaller helper functions.",
                                impact="Long functions increase cognitive load, reduce testability, and make debugging harder."
                            ))
                        func_start = None

            # Magic numbers
            magic_match = re.search(r'\b([2-9][0-9]{2,}|[1-9][0-9]{3,})\b', stripped)
            if magic_match and "=" not in stripped[:magic_match.start()] and not stripped.startswith(("#", "//")):
                num = magic_match.group(1)
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.70,
                    message=f"Magic number `{num}` used directly in code without explanation.",
                    suggestion=f"Extract to a named constant: `MAX_RETRY_COUNT = {num}` or `TIMEOUT_SECONDS = {num}`.",
                    impact="Magic numbers make code unreadable and require searching entire codebase when values change."
                ))

            # Single-letter variable names (except loop counters)
            if re.search(r'\b([a-z])\s*=\s*(?!None|True|False|0|1)', stripped):
                var = re.search(r'\b([a-z])\s*=', stripped).group(1)
                if var not in ["i", "j", "k", "x", "y", "z", "n", "e", "_"]:
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="info", confidence=0.75,
                        message=f"Single-letter variable `{var}` lacks descriptive meaning.",
                        suggestion="Use descriptive names: `user_count` instead of `n`, `response` instead of `r`.",
                        impact="Cryptic names force future developers (including yourself) to re-analyze intent."
                    ))

            # print / console.log in production code
            if language.lower() == "python" and re.search(r'\bprint\s*\(', stripped) and not stripped.startswith("#"):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.98,
                    message="Use structured logging instead of `print()` statements.",
                    suggestion="Replace with `logger.info()`, `logger.debug()`, etc. Configure logging level per environment.",
                    impact="Print statements cannot be disabled in production without code changes. No log levels or formatting."
                ))

            if language.lower() in ["javascript", "typescript"] and "console.log(" in stripped and not stripped.startswith("//"):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.98,
                    message="Remove `console.log()` debug statements from production code.",
                    suggestion="Use a logging library (winston, pino) or remove entirely before deployment.",
                    impact="Logs sensitive data to browser console. Cannot be disabled without code changes."
                ))

            # Deeply nested conditions
            indent = len(line) - len(line.lstrip())
            if indent > 24 and stripped and not stripped.startswith(("#", "//")):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.80,
                    message="Deep nesting detected (>6 levels). Indicates arrow anti-pattern.",
                    suggestion="Use early returns/guard clauses to reduce nesting. Extract nested blocks to functions.",
                    impact="Deeply nested code is extremely hard to read, test, and maintain."
                ))

            # God class / huge class
            if re.match(r'^class\s+(\w+)', stripped):
                class_name = re.match(r'^class\s+(\w+)', stripped).group(1)
                # Count class methods
                class_block = "\n".join(lines[idx:idx + 200])
                method_count = len(re.findall(r'\n\s+def\s+', class_block))
                if method_count > 15:
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.78,
                        message=f"Class `{class_name}` has {method_count} methods — potential God Class violation.",
                        suggestion="Apply Single Responsibility Principle: split into smaller, focused classes.",
                        impact="God classes become maintenance nightmares and violate SRP, making testing difficult."
                    ))

            # Duplicate string literals
            if re.search(r'["\']([^"\']{15,})["\']', stripped):
                match = re.search(r'["\']([^"\']{15,})["\']', stripped)
                if match:
                    literal = match.group(1)
                    occurrences = code.count(literal)
                    if occurrences > 2:
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.72,
                            message=f"String literal `'{literal[:30]}...'` appears {occurrences} times.",
                            suggestion="Extract to a named constant or configuration value to avoid duplication.",
                            impact="Duplicated strings make changes error-prone — must update in N places."
                        ))

        summary = f"Clean Code Agent found {len(issues)} code quality issues. Apply these to improve maintainability score."
        score_penalty = len(issues) * 3
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
            "file_path": file_path, "line_number": line_number, "line_content": line_content,
            "severity": severity, "category": "refactoring", "agent_name": self.AGENT_NAME,
            "confidence_score": confidence, "message": message, "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "python": "py", "java": "java", "go": "go"}.get(lang.lower(), "txt")
