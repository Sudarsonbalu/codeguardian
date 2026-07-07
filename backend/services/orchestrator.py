"""
AI Orchestrator — Coordinates all specialized AI agents, runs them in
parallel, merges results, deduplicates issues, and computes a final AI score.
"""
from __future__ import annotations
import asyncio
import random
from typing import List, Dict, Any, Optional

from backend.services.agents.bug_agent import BugDetectionAgent
from backend.services.agents.security_agent import SecurityAgent
from backend.services.agents.performance_agent import PerformanceAgent
from backend.services.agents.clean_code_agent import CleanCodeAgent
from backend.services.agents.docs_agent import DocumentationAgent
from backend.services.agents.test_agent import TestGenerationAgent
from backend.services.agents.architecture_agent import ArchitectureAgent
from backend.config import settings


class AIOrchestrator:
    """
    Central orchestrator that:
    1. Accepts code + language + review_types
    2. Fans out to all relevant agents concurrently
    3. Merges and deduplicates issues
    4. Computes per-agent confidence and overall AI score
    5. Returns a comprehensive unified report
    """

    def __init__(self):
        self.agents = {
            "bug": BugDetectionAgent(),
            "security": SecurityAgent(),
            "performance": PerformanceAgent(),
            "clean_code": CleanCodeAgent(),
            "documentation": DocumentationAgent(),
            "testing": TestGenerationAgent(),
            "architecture": ArchitectureAgent(),
        }

    async def run(
        self,
        code: str,
        language: str,
        review_types: Optional[List[str]] = None,
        on_progress=None,
        openai_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run all applicable agents concurrently and merge results.

        Args:
            code: Source code string
            language: Programming language
            review_types: List of review types to focus on (None = all)
            on_progress: Optional async callback(agent_name, progress_pct)
            openai_api_key: Optional dynamic OpenAI API key

        Returns:
            Unified analysis report dict
        """
        active_api_key = openai_api_key or settings.OPENAI_API_KEY
        if active_api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=active_api_key)
                
                system_prompt = (
                    "You are an expert software engineering assistant. Your task is to perform a detailed "
                    "multi-agent review of the provided code. Analyze the code under these agent perspectives:\n"
                    "- Bug Detection Agent: find bugs, syntax errors, structural flaws.\n"
                    "- Security Agent: identify OWASP Top 10 vulnerabilities, leaks, SQL injections.\n"
                    "- Performance Agent: find performance bottlenecks, redundant code loops.\n"
                    "- Clean Code Agent: suggest style improvements, variable name cleanups.\n"
                    "- Documentation Agent: spot missing documentation or docstrings.\n"
                    "- Test Generation Agent: suggest unit test cases.\n"
                    "- Architecture Agent: check modularity, package dependencies, system design.\n\n"
                    "You MUST respond with a JSON object containing this exact structure (no other conversational text):\n"
                    "{\n"
                    "  \"issues\": [\n"
                    "    {\n"
                    "      \"file_path\": \"filename.ext\",\n"
                    "      \"line_number\": 12,\n"
                    "      \"line_content\": \"stripe.api_key = '...'\",\n"
                    "      \"severity\": \"critical\", // values: 'critical', 'error', 'warning', 'info'\n"
                    "      \"category\": \"security\", // values: 'bug', 'security', 'performance', 'clean_code', 'documentation', 'testing', 'architecture'\n"
                    "      \"agent_name\": \"Security Agent\",\n"
                    "      \"confidence_score\": 0.95,\n"
                    "      \"message\": \"Exposed Stripe secret key...\",\n"
                    "      \"suggestion\": \"Move the Stripe key to env...\",\n"
                    "      \"impact_analysis\": \"Credential theft...\"\n"
                    "    }\n"
                    "  ],\n"
                    "  \"agent_summaries\": {\n"
                    "    \"Bug Detection Agent\": \"summary...\",\n"
                    "    \"Security Agent\": \"summary...\",\n"
                    "    \"Performance Agent\": \"summary...\",\n"
                    "    \"Clean Code Agent\": \"summary...\",\n"
                    "    \"Documentation Agent\": \"summary...\",\n"
                    "    \"Test Generation Agent\": \"summary...\",\n"
                    "    \"Architecture Agent\": \"summary...\"\n"
                    "  },\n"
                    "  \"architecture_diagram\": \"mermaid syntax...\"\n"
                    "}"
                )
                
                user_prompt = f"Language: {language}\nCode:\n```\n{code}\n```"
                
                completion = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                
                raw_response = completion.choices[0].message.content
                import json
                ai_data = json.loads(raw_response)
                
                issues = ai_data.get("issues", [])
                agent_summaries = {}
                for agent_name, summary in ai_data.get("agent_summaries", {}).items():
                    agent_summaries[agent_name] = {
                        "summary": summary,
                        "icon": "🤖",
                        "issue_count": len([i for i in issues if i.get("agent_name") == agent_name]),
                        "score_contribution": 90,
                    }
                
                filtered_issues = []
                for issue in issues:
                    cat = issue.get("category", "").lower()
                    if review_types is None or cat in [rt.lower() for rt in review_types]:
                        filtered_issues.append(issue)
                        
                critical_count = sum(1 for i in filtered_issues if i.get("severity") == "critical")
                error_count = sum(1 for i in filtered_issues if i.get("severity") == "error")
                final_score = max(25.0, 95.0 - critical_count * 8 - error_count * 3)
                final_score = round(min(final_score, 99.0), 1)
                
                return {
                    "issues": filtered_issues,
                    "final_score": final_score,
                    "agent_summaries": agent_summaries,
                    "architecture_diagram": ai_data.get("architecture_diagram", ""),
                    "total_issues": len(filtered_issues),
                    "critical_count": critical_count,
                    "error_count": error_count,
                    "warning_count": sum(1 for i in filtered_issues if i.get("severity") == "warning"),
                    "info_count": sum(1 for i in filtered_issues if i.get("severity") == "info"),
                    "agents_run": list(agent_summaries.keys()),
                }
            except Exception as e:
                print(f"OpenAI completion failed (falling back to rule engine): {e}")

        if review_types is None:
            review_types = list(self.agents.keys())

        # Map review_types to agent keys
        active_agents = {}
        type_map = {
            "bug": "bug",
            "security": "security",
            "performance": "performance",
            "style": "clean_code",
            "clean_code": "clean_code",
            "documentation": "documentation",
            "testing": "testing",
            "architecture": "architecture",
        }
        for rt in review_types:
            key = type_map.get(rt.lower(), rt.lower())
            if key in self.agents:
                active_agents[key] = self.agents[key]

        # Default: run all agents if none matched
        if not active_agents:
            active_agents = self.agents

        # Run all agents concurrently via asyncio
        loop = asyncio.get_event_loop()

        async def run_agent_async(key: str, agent) -> Dict[str, Any]:
            result = await loop.run_in_executor(None, agent.analyze, code, language)
            if on_progress:
                await on_progress(agent.AGENT_NAME, result)
            return result

        tasks = [run_agent_async(k, a) for k, a in active_agents.items()]
        agent_results: List[Dict[str, Any]] = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out any exceptions
        valid_results = [r for r in agent_results if isinstance(r, dict)]

        # Merge all issues from all agents
        all_issues = []
        agent_summaries = {}
        score_contributions = []

        for result in valid_results:
            agent_name = result.get("agent", "Unknown Agent")
            agent_issues = result.get("issues", [])
            all_issues.extend(agent_issues)
            agent_summaries[agent_name] = {
                "summary": result.get("summary", ""),
                "icon": result.get("icon", "🤖"),
                "issue_count": result.get("issue_count", 0),
                "score_contribution": result.get("score_contribution", 80),
            }
            score_contributions.append(result.get("score_contribution", 80))

        # Deduplicate issues (same line + same message)
        seen = set()
        unique_issues = []
        for issue in all_issues:
            key = (issue.get("line_number", 0), issue.get("message", "")[:50])
            if key not in seen:
                seen.add(key)
                unique_issues.append(issue)

        # Sort by severity priority
        severity_order = {"critical": 0, "error": 1, "warning": 2, "info": 3}
        unique_issues.sort(key=lambda x: severity_order.get(x.get("severity", "info"), 3))

        # Compute final AI score
        if score_contributions:
            base_score = sum(score_contributions) / len(score_contributions)
        else:
            base_score = 75.0

        # Penalize for critical/error issues
        critical_count = sum(1 for i in unique_issues if i.get("severity") == "critical")
        error_count = sum(1 for i in unique_issues if i.get("severity") == "error")
        final_score = max(25.0, base_score - critical_count * 8 - error_count * 3)
        final_score = round(min(final_score, 99.0), 1)

        # Generate architecture diagram from architecture agent
        arch_result = next((r for r in valid_results if r.get("agent") == "Architecture Agent"), {})
        architecture_diagram = arch_result.get("architecture_diagram", "")

        return {
            "issues": unique_issues,
            "final_score": final_score,
            "agent_summaries": agent_summaries,
            "architecture_diagram": architecture_diagram,
            "total_issues": len(unique_issues),
            "critical_count": critical_count,
            "error_count": error_count,
            "warning_count": sum(1 for i in unique_issues if i.get("severity") == "warning"),
            "info_count": sum(1 for i in unique_issues if i.get("severity") == "info"),
            "agents_run": list(agent_summaries.keys()),
        }

    def generate_commit_message(self, issues: List[Dict], review_title: str) -> Dict[str, str]:
        """Generate a conventional commit message based on detected issues."""
        critical = [i for i in issues if i.get("severity") == "critical"]
        errors = [i for i in issues if i.get("severity") == "error"]
        categories = list(set(i.get("category", "fix") for i in (critical or errors or issues[:3])))

        commit_type = "fix"
        if "security" in categories:
            commit_type = "fix"
            scope = "security"
        elif "performance" in categories:
            commit_type = "perf"
            scope = "performance"
        elif "documentation" in categories:
            commit_type = "docs"
            scope = "docs"
        elif "refactoring" in categories:
            commit_type = "refactor"
            scope = "code-quality"
        else:
            scope = "core"

        subject = f"Address {len(issues)} code quality issues in {review_title}"
        if critical:
            subject = f"Fix critical {critical[0].get('category', 'security')} vulnerability in {review_title}"

        body_lines = []
        for issue in issues[:5]:
            body_lines.append(f"- [{issue.get('severity','info').upper()}] {issue.get('message','')[:80]}")

        return {
            "commit_message": f"{commit_type}({scope}): {subject}",
            "commit_body": "\n".join(body_lines),
            "commit_type": commit_type,
            "scope": scope,
            "full_message": f"{commit_type}({scope}): {subject}\n\n" + "\n".join(body_lines),
        }


# Singleton instance
orchestrator = AIOrchestrator()
