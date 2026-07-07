"""
Architecture Agent — Analyzes architectural patterns, coupling,
layer violations, module structure, and design anti-patterns.
"""
from __future__ import annotations
import re
from typing import Dict, Any, List


class ArchitectureAgent:
    AGENT_NAME = "Architecture Agent"
    AGENT_ICON = "🏗️"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)

        imports: List[str] = []
        classes: List[str] = []
        has_db_in_view = False
        has_business_in_db = False

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            # Collect imports
            if stripped.startswith("import ") or stripped.startswith("from "):
                imports.append(stripped)

            # Detect classes
            class_m = re.match(r'^class\s+(\w+)', stripped)
            if class_m:
                classes.append(class_m.group(1))

            # Star imports — pollute namespace
            if re.match(r'^from\s+\S+\s+import\s+\*', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.95,
                    message="Wildcard import `from module import *` pollutes namespace.",
                    suggestion="Import only what you need: `from module import ClassA, function_b`.",
                    impact="Wildcard imports make it impossible to know where names come from, cause naming conflicts."
                ))

            # Circular import risk
            if re.match(r'^from\s+\.\s+import|^from\s+\.\.\s+import', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.65,
                    message="Relative import detected — verify no circular dependency exists.",
                    suggestion="Use absolute imports where possible. Draw dependency graph to verify no cycles.",
                    impact="Circular imports cause ImportError at runtime and make module structure fragile."
                ))

            # DB access mixed with view/route logic
            if any(route_kw in stripped for route_kw in ["@app.route", "@router.get", "@router.post"]):
                block = "\n".join(lines[idx:idx + 30])
                if re.search(r'\b(db\.|session\.|cursor\.execute|\.query\()', block):
                    has_db_in_view = True
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.85,
                        message="Direct database access inside route/controller violates layered architecture.",
                        suggestion="Extract DB operations to a service/repository layer. Routes should only orchestrate.",
                        impact="Mixing DB logic with routes makes unit testing impossible and creates tight coupling."
                    ))

            # Long import chains (too many dependencies = high coupling)
            if len(imports) > 20 and idx < 30:
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="info", confidence=0.70,
                    message=f"File has {len(imports)} imports — high dependency count suggests violation of SRP.",
                    suggestion="Consider splitting this module into smaller, focused modules with fewer responsibilities.",
                    impact="High coupling makes changes ripple across the codebase unpredictably."
                ))
                break  # Only report once

            # God module (everything in one file)
            if len(lines) > 500 and idx == len(lines) - 1:
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=1, line_content=lines[0],
                    severity="warning", confidence=0.88,
                    message=f"File is {len(lines)} lines long. Single files over 500 lines indicate poor modularization.",
                    suggestion="Split into multiple focused modules: separate models, services, utilities, and routes.",
                    impact="Large files are hard to navigate, increase merge conflicts, and violate SRP."
                ))

            # Hardcoded configuration values
            if re.search(r'(?i)(host|port|database|server)\s*=\s*["\'][^"\']+["\']', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.82,
                    message="Hardcoded infrastructure configuration (host/port/database) in source code.",
                    suggestion="Use a configuration file or environment variables: `HOST = os.getenv('DB_HOST', 'localhost')`",
                    impact="Hardcoded config prevents deploying to different environments without code changes."
                ))

        # Generate architecture diagram suggestion
        diagram_suggestion = self._generate_mermaid_diagram(classes, imports)

        summary = (
            f"Architecture Agent identified {len(issues)} structural and design issues. "
            f"Detected {len(classes)} classes and {len(imports)} imports."
        )

        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(68, 100 - len(issues) * 5),
            "issue_count": len(issues),
            "architecture_diagram": diagram_suggestion,
            "class_count": len(classes),
            "import_count": len(imports),
        }

    def _generate_mermaid_diagram(self, classes: List[str], imports: List[str]) -> str:
        """Generate a basic Mermaid class diagram from detected classes."""
        if not classes:
            return "graph LR\n    A[Code Module] --> B[External Dependencies]\n    A --> C[Database]\n    A --> D[API Layer]"

        lines = ["classDiagram"]
        for cls in classes[:8]:  # Limit to 8 classes
            lines.append(f"    class {cls} {{")
            lines.append(f"        +methods()")
            lines.append(f"    }}")
        if len(classes) > 1:
            lines.append(f"    {classes[0]} --> {classes[1]}")
        return "\n".join(lines)

    def _issue(self, file_path, line_number, line_content, severity, confidence, message, suggestion, impact):
        return {
            "file_path": file_path, "line_number": line_number, "line_content": line_content,
            "severity": severity, "category": "refactoring", "agent_name": self.AGENT_NAME,
            "confidence_score": confidence, "message": message, "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "python": "py", "java": "java"}.get(lang.lower(), "txt")
