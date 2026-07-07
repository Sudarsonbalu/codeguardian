"""
Security Agent — Detects OWASP Top 10, injection attacks, hardcoded secrets,
authentication flaws, and insecure configurations.
"""
from __future__ import annotations
import re
from typing import List, Dict, Any


class SecurityAgent:
    """
    Analyzes code for security vulnerabilities:
    - SQL Injection (SQLi)
    - Cross-Site Scripting (XSS)
    - Hardcoded credentials / API keys
    - Command injection
    - Path traversal
    - Insecure direct object reference
    - Broken authentication patterns
    - Sensitive data exposure
    """

    AGENT_NAME = "Security Agent"
    AGENT_ICON = "🔒"

    # Regex patterns for credential detection
    CREDENTIAL_PATTERNS = [
        (r'(?i)(password|passwd|pwd)\s*=\s*["\'][^"\']{3,}["\']', "Hardcoded password"),
        (r'(?i)(api[_-]?key|apikey)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded API key"),
        (r'(?i)(secret[_-]?key|secret)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded secret key"),
        (r'(?i)(access[_-]?token|auth[_-]?token)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded access token"),
        (r'(?i)bearer\s+[A-Za-z0-9\-_\.]{20,}', "Hardcoded Bearer token"),
        (r'(?i)(private[_-]?key)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded private key"),
        (r'SG\.[A-Za-z0-9_-]{22,}', "Hardcoded SendGrid API key"),
        (r'sk-[A-Za-z0-9]{32,}', "Hardcoded OpenAI secret key"),
        (r'ghp_[A-Za-z0-9]{36}', "Hardcoded GitHub personal access token"),
        (r'AKIA[0-9A-Z]{16}', "Hardcoded AWS Access Key ID"),
    ]

    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        issues = []
        lines = code.split("\n")
        ext = self._ext(language)

        for idx, line in enumerate(lines):
            ln = idx + 1
            stripped = line.strip()

            # --- Hardcoded Credentials ---
            for pattern, cred_type in self.CREDENTIAL_PATTERNS:
                if re.search(pattern, stripped) and not stripped.startswith(("#", "//")):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="critical", confidence=0.97,
                        message=f"{cred_type} detected in source code.",
                        suggestion="Move this secret to environment variables. Use `os.getenv('KEY_NAME')` in Python or `process.env.KEY_NAME` in Node.js. Add to .gitignore.",
                        impact="Leaked credentials in VCS can be scraped by bots within seconds. Leads to data breaches and account takeovers."
                    ))

            # --- SQL Injection ---
            sql_injection_patterns = [
                r'execute\s*\(\s*f["\']',
                r'execute\s*\(\s*["\'].*\+',
                r'execute\s*\(\s*".*%\s*\(',
                r'query\s*=.*\+\s*\w+',
                r'WHERE\s+\w+\s*=\s*["\']?\s*\+',
            ]
            for pattern in sql_injection_patterns:
                if re.search(pattern, stripped, re.IGNORECASE) and not stripped.startswith(("#", "//")):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="critical", confidence=0.94,
                        message="SQL Injection vulnerability: User input concatenated directly into SQL query.",
                        suggestion="Use parameterized queries: `cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))` or use an ORM like SQLAlchemy.",
                        impact="Attackers can read, modify, or delete entire database. OWASP A03:2021."
                    ))
                    break

            # --- XSS (JavaScript/TypeScript) ---
            if language.lower() in ["javascript", "typescript", "typescriptreact"]:
                if "innerHTML" in stripped and not stripped.startswith("//"):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="error", confidence=0.91,
                        message="Direct DOM `innerHTML` assignment allows XSS injection.",
                        suggestion="Use `textContent` instead of `innerHTML`, or sanitize with DOMPurify before inserting HTML.",
                        impact="Attackers can inject malicious scripts that steal cookies and session tokens. OWASP A03:2021."
                    ))

                if "dangerouslySetInnerHTML" in stripped:
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="warning", confidence=0.85,
                        message="React `dangerouslySetInnerHTML` used — potential XSS if content is user-controlled.",
                        suggestion="Sanitize HTML with DOMPurify before passing to `dangerouslySetInnerHTML`. Avoid if possible.",
                        impact="User-controlled HTML rendered unsanitized leads to stored XSS attacks."
                    ))

            # --- Command Injection ---
            cmd_patterns = [
                r'os\.system\s*\(',
                r'subprocess\.(call|run|Popen)\s*\(.*\+',
                r'exec\s*\(\s*\w+',
                r'eval\s*\(',
            ]
            for pattern in cmd_patterns:
                if re.search(pattern, stripped) and not stripped.startswith(("#", "//")):
                    issues.append(self._issue(
                        file_path=f"code.{ext}", line_number=ln, line_content=line,
                        severity="critical", confidence=0.93,
                        message="Potential command/code injection: user input passed to OS command or `eval()`.",
                        suggestion="Validate and sanitize all inputs. Use subprocess with a list of args instead of shell=True. Avoid `eval()` entirely.",
                        impact="Remote code execution. Attackers can run arbitrary commands on the server. OWASP A03:2021."
                    ))
                    break

            # --- Path Traversal ---
            if re.search(r'(open|read_file|send_file)\s*\(.*\+.*\)', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="error", confidence=0.80,
                    message="Potential path traversal: file path constructed from concatenated input.",
                    suggestion="Use `os.path.abspath()` and validate the resolved path stays within allowed directory. Use allowlists for file access.",
                    impact="Attackers can read sensitive files like `/etc/passwd` or application configuration files."
                ))

            # --- Insecure HTTP ---
            if re.search(r'http://(?!localhost|127\.0\.0\.1)', stripped) and "https://" not in stripped:
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.88,
                    message="Insecure HTTP URL used instead of HTTPS.",
                    suggestion="Replace `http://` with `https://` to ensure encrypted data transmission.",
                    impact="Data transmitted over HTTP is plaintext and can be intercepted by MITM attacks."
                ))

            # --- Weak Random for Security ---
            if re.search(r'\brandom\.(random|randint|choice)\b', stripped) and \
               any(kw in "\n".join(lines[max(0,idx-5):idx+5]).lower() for kw in ["token", "secret", "password", "salt", "key", "csrf"]):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="error", confidence=0.88,
                    message="Weak random number generator used in security-sensitive context.",
                    suggestion="Use `secrets.token_hex(32)` or `secrets.token_urlsafe()` for cryptographic randomness.",
                    impact="Predictable tokens allow attackers to forge session tokens or CSRF tokens."
                ))

            # --- SSRF (Server-Side Request Forgery) ---
            if re.search(r'requests\.(get|post|put|delete|patch)\s*\(\s*\w+', stripped) and not any(kw in stripped for kw in ["localhost", "127.0.0.1"]):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="error", confidence=0.82,
                    message="Potential SSRF (Server-Side Request Forgery): user input controls request URL.",
                    suggestion="Use a strict domain allowlist. Never let user inputs fully define HTTP query parameters.",
                    impact="Allows attackers to scan internal networks, reach metadata servers, and access unexposed microservices."
                ))

            # --- JWT Security checks ---
            if re.search(r'jwt\.decode\s*\(.*algorithms\s*=\s*\[\s*["\']none["\']\s*\]', stripped, re.IGNORECASE):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="critical", confidence=0.98,
                    message="JWT None Algorithm Allowed: accepting unverified signatures.",
                    suggestion="Never accept 'none' algorithm. Force verification with secure keys and strict algorithms (HS256).",
                    impact="Attackers can completely bypass auth headers by specifying alg: none."
                ))

            # --- CSRF Missing check ---
            if "form" in stripped.lower() and "method" in stripped.lower() and "csrf" not in stripped.lower() and "post" in stripped.lower():
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="error", confidence=0.75,
                    message="Form method post is missing explicit CSRF protection token validation.",
                    suggestion="Ensure CSRF anti-forgery tokens are sent with state-changing requests.",
                    impact="Allows attackers to trick users into executing actions on authentic sites."
                ))

            # --- Dependency CVE Check ---
            if "requirements.txt" in file_path or "package.json" in file_path:
                if "requests<2.31.0" in stripped or "django<4.2" in stripped:
                    issues.append(self._issue(
                        file_path=file_path, line_number=ln, line_content=line,
                        severity="error", confidence=0.90,
                        message="Dependency contains known security CVE vulnerability.",
                        suggestion="Upgrade dependency to a patched version.",
                        impact="Vulnerable dependencies can lead to Remote Code Execution or privilege escalation."
                    ))

            # --- Debug mode in production config ---
            if re.search(r'(?i)debug\s*=\s*True', stripped):
                issues.append(self._issue(
                    file_path=f"code.{ext}", line_number=ln, line_content=line,
                    severity="warning", confidence=0.95,
                    message="Debug mode enabled — exposes stack traces and internal state to users.",
                    suggestion="Set `DEBUG = False` in production. Use environment variable: `DEBUG = os.getenv('DEBUG', 'False') == 'True'`",
                    impact="Debug output leaks application internals, file paths, and sensitive configuration data."
                ))

        summary = (
            f"Security Agent identified {len(issues)} security vulnerabilities. "
            f"{'⚠️ CRITICAL issues require immediate attention.' if any(i['severity'] == 'critical' for i in issues) else 'No critical issues found.'}"
        )
        critical_count = sum(1 for i in issues if i["severity"] == "critical")
        score_penalty = critical_count * 15 + (len(issues) - critical_count) * 5

        return {
            "agent": self.AGENT_NAME,
            "icon": self.AGENT_ICON,
            "issues": issues,
            "summary": summary,
            "score_contribution": max(50, 100 - score_penalty),
            "issue_count": len(issues),
        }

    def _issue(self, file_path, line_number, line_content, severity, confidence, message, suggestion, impact):
        return {
            "file_path": file_path,
            "line_number": line_number,
            "line_content": line_content,
            "severity": severity,
            "category": "security",
            "agent_name": self.AGENT_NAME,
            "confidence_score": confidence,
            "message": message,
            "suggestion": suggestion,
            "impact_analysis": impact,
        }

    def _ext(self, lang: str) -> str:
        return {"javascript": "js", "typescript": "ts", "typescriptreact": "tsx",
                "javascriptreact": "jsx", "python": "py", "java": "java",
                "cpp": "cpp", "go": "go"}.get(lang.lower(), "txt")
