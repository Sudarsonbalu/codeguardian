import json
from openai import OpenAI
from backend.config import settings

def analyze_code_with_openai(code: str, language: str, review_types: list) -> tuple:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OpenAI API Key is not set")
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    Analyze the following {language} code for issues. The user wants to focus on: {", ".join(review_types)}.
    
    Code to analyze:
    ```
    {code}
    ```
    
    Respond STRICTLY in JSON format with two keys:
    1. "score": An integer from 0 to 100 indicating the overall code quality rating.
    2. "issues": A list of objects. Each object represents an issue and must have:
       - "line_number": integer
       - "severity": "info", "warning", "error", or "critical"
       - "category": "security", "bug", "performance", "documentation", or "refactoring"
       - "message": a short description of the issue
       - "suggestion": detailed suggestion of how to fix it
       - "line_content": the exact string value of the code on that line
       
    Make sure output is JSON only. No other formatting wrapper.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a professional code review engine."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    score = result.get("score", 80)
    issues = result.get("issues", [])
    
    return issues, score
