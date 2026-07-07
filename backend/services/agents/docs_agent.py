"""
Documentation Agent — Checks for missing docstrings, type hints,
README, inline comments, and API documentation coverage.
"""
from __future__ import annotations
import re
from typing import Dict, Any


class DocumentationAgent:
    AGENT_NAME = "Documentation Agent"
    AGENT_ICON = "📚"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)
        total_functions = 0
        documented_functions = 0

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            if language.lower() == "python":
                # Missing function docstring
                func_match = re.match(r'^def\s+(\w+)\s*\(', stripped)
                if func_match and not func_match.group(1).startswith("_"):
                    total_functions += 1
                    next_lines = "\n".join(lines[idx + 1: idx + 4])
                    if '"""' not in next_lines and "'''" not in next_lines:
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="warning", confidence=0.97,
                            message=f"Public function `{func_match.group(1)}` is missing a docstring.",
                            suggestion='Add a Google-style docstring:\n"""Brief description.\n\nArgs:\n    param (type): Description.\n\nReturns:\n    type: Description.\n"""',
                            impact="Missing docs force developers to read implementation to understand usage."
                        ))
                    else:
                        documented_functions += 1

                # Missing type hints
                func_match2 = re.match(r'^def\s+(\w+)\s*\(([^)]*)\)', stripped)
                if func_match2:
                    params = func_match2.group(2)
                    param_list = [p.strip() for p in params.split(",") if p.strip() and p.strip() != "self"]
                    untyped = [p for p in param_list if ":" not in p and p and not p.startswith("*")]
                    if untyped:
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.90,
                            message=f"Parameters `{', '.join(untyped[:3])}` lack type annotations.",
                            suggestion="Add type hints: `def process(user_id: int, name: str) -> bool:`",
                            impact="Missing type hints reduce IDE support, break mypy checks, and obscure API contracts."
                        ))

                # Missing class docstring
                class_match = re.match(r'^class\s+(\w+)', stripped)
                if class_match:
                    next_lines = "\n".join(lines[idx + 1: idx + 3])
                    if '"""' not in next_lines:
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.92,
                            message=f"Class `{class_match.group(1)}` is missing a class-level docstring.",
                            suggestion='Add: `"""Brief class description and its purpose."""`',
                            impact="Undocumented classes require reading all methods to understand purpose."
                        ))

            if language.lower() in ["javascript", "typescript", "typescriptreact"]:
                # Missing JSDoc
                func_match = re.search(r'(function\s+(\w+)|const\s+(\w+)\s*=.*=>)', stripped)
                if func_match and not stripped.startswith("//"):
                    total_functions += 1
                    # Check for JSDoc comment above
                    prev_lines = "\n".join(lines[max(0, idx - 3): idx])
                    if "/**" not in prev_lines and "@param" not in prev_lines:
                        fname = func_match.group(2) or func_match.group(3) or "function"
                        issues.append(self._issue(
                            file_path=f"code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.85,
                            message=f"Function `{fname}` is missing JSDoc documentation.",
                            suggestion="Add JSDoc:\n/**\n * Brief description.\n * @param {type} name - Description\n * @returns {type} Description\n */",
                            impact="Missing JSDoc reduces IDE IntelliSense support and auto-generated API docs quality."
                        ))

            # Complex logic without explanation comment
            if re.search(r'\b(regex|pattern|formula|algorithm|cipher|encode|decode)\b', stripped, re.IGNORECASE):
                prev = lines[idx - 1].strip() if idx > 0 else ""
                if not prev.startswith(("#", "//", "*")):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="info", confidence=0.68,
                        message="Complex logic without explanatory comment.",
                        suggestion="Add an inline comment explaining the algorithm, regex pattern, or formula purpose.",
                        impact="Future developers cannot quickly understand complex logic without comments."
                    ))

        # Documentation coverage metric
        doc_coverage = (documented_functions / total_functions * 100) if total_functions > 0 else 100
        if doc_coverage < 70 and total_functions > 3:
            issues.insert(0, self._issue(
                file_path=f"code.{ext}", line_number=1, line_content=lines[0] if lines else "",
                severity="warning", confidence=0.95,
                message=f"Documentation coverage is {doc_coverage:.0f}% ({documented_functions}/{total_functions} functions documented).",
                suggestion="Aim for >80% documentation coverage. Add docstrings to all public functions and classes.",
                impact="Low doc coverage means new team members spend hours understanding existing code."
            ))

        summary = (
            f"Documentation Agent found {len(issues)} documentation gaps. "
            f"Doc coverage: {doc_coverage:.0f}%."
        )
        score_penalty = len(issues) * 3
        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(72, 100 - score_penalty),
            "issue_count": len(issues),
            "doc_coverage": round(doc_coverage, 1),
        }

    def _issue(self, file_path, line_number, line_content, severity, confidence, message, suggestion, impact):
        return {
            "file_path": file_path, "line_number": line_number, "line_content": line_content,
            "severity": severity, "category": "documentation", "agent_name": self.AGENT_NAME,
            "confidence_score": confidence, "message": message, "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "python": "py", "java": "java"}.get(lang.lower(), "txt")
