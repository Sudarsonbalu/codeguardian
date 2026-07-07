"""
Test Generation Agent — Detects untested functions and generates
test stubs/skeletons for discovered functions and classes.
"""
from __future__ import annotations
import re
from typing import Dict, Any, List


class TestGenerationAgent:
    AGENT_NAME = "Test Generation Agent"
    AGENT_ICON = "🧪"

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)
        functions_found: List[str] = []
        classes_found: List[str] = []

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            if language.lower() == "python":
                func_match = re.match(r'^def\s+(\w+)\s*\(', stripped)
                if func_match:
                    fname = func_match.group(1)
                    if not fname.startswith("test_") and not fname.startswith("_"):
                        functions_found.append(fname)
                        issues.append(self._issue(
                            file_path=f"test_code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.88,
                            message=f"Function `{fname}` has no corresponding unit test detected.",
                            suggestion=self._generate_pytest_stub(fname),
                            impact="Untested code increases risk of regressions and makes refactoring dangerous."
                        ))

                class_match = re.match(r'^class\s+(\w+)', stripped)
                if class_match:
                    cname = class_match.group(1)
                    if not cname.startswith("Test"):
                        classes_found.append(cname)
                        issues.append(self._issue(
                            file_path=f"test_code.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.85,
                            message=f"Class `{cname}` has no corresponding test class.",
                            suggestion=self._generate_class_test_stub(cname),
                            impact="Class behavior is unverified. Integration bugs may go undetected."
                        ))

            elif language.lower() in ["javascript", "typescript", "typescriptreact"]:
                func_match = re.search(r'(?:function\s+(\w+)|const\s+(\w+)\s*=.*=>|export\s+(?:default\s+)?function\s+(\w+))', stripped)
                if func_match:
                    fname = func_match.group(1) or func_match.group(2) or func_match.group(3) or "unknownFn"
                    if fname not in ["describe", "it", "test", "expect", "beforeEach", "afterEach"]:
                        functions_found.append(fname)
                        issues.append(self._issue(
                            file_path=f"code.test.{ext}", line_number=ln, line_content=line,
                            severity="info", confidence=0.82,
                            message=f"Function `{fname}` lacks a Jest/Vitest unit test.",
                            suggestion=self._generate_jest_stub(fname),
                            impact="Untested function will not catch regressions during future refactoring."
                        ))

        # Check for any existing test file indicators
        has_tests = bool(re.search(r'\b(test_|_test|\.spec\.|describe\(|it\(|def test_)', code))
        if not has_tests and len(functions_found) > 0:
            issues.insert(0, self._issue(
                file_path=f"code.{ext}", line_number=1, line_content=lines[0] if lines else "",
                severity="warning", confidence=0.95,
                message=f"No test file detected. {len(functions_found)} functions have zero test coverage.",
                suggestion=f"Create a test file `test_{ext == 'py' and 'code.py' or 'code.test.' + ext}` and add tests for all public functions.",
                impact="Zero test coverage means any code change can silently break functionality."
            ))

        summary = (
            f"Test Generation Agent identified {len(functions_found)} untested functions "
            f"and {len(classes_found)} untested classes."
        )
        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(60, 100 - len(issues) * 4),
            "issue_count": len(issues),
            "untested_functions": functions_found,
        }

    def _generate_pytest_stub(self, func_name: str) -> str:
        return (
            f"def test_{func_name}_success():\n"
            f"    # Arrange\n"
            f"    # Act\n"
            f"    result = {func_name}()\n"
            f"    # Assert\n"
            f"    assert result is not None\n\n"
            f"def test_{func_name}_edge_case():\n"
            f"    # Test with boundary / edge case inputs\n"
            f"    pass"
        )

    def _generate_class_test_stub(self, class_name: str) -> str:
        return (
            f"class Test{class_name}:\n"
            f"    def setup_method(self):\n"
            f"        self.instance = {class_name}()\n\n"
            f"    def test_initialization(self):\n"
            f"        assert self.instance is not None\n\n"
            f"    def test_core_behavior(self):\n"
            f"        # Test main functionality\n"
            f"        pass"
        )

    def _generate_jest_stub(self, func_name: str) -> str:
        return (
            f"describe('{func_name}', () => {{\n"
            f"  it('should work with valid input', () => {{\n"
            f"    const result = {func_name}();\n"
            f"    expect(result).toBeDefined();\n"
            f"  }});\n\n"
            f"  it('should handle edge cases', () => {{\n"
            f"    // Add edge case tests\n"
            f"  }});\n"
            f"}});"
        )

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
