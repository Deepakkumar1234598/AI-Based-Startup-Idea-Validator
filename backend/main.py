
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from tavily import TavilyClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Startup Idea Validator API",
    description="AI-powered startup validation system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "https://ai-based-startup-idea-validator-fro.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class StartupRequest(BaseModel):
    idea: str
    audience: str = "General customers"
    location: str = "India"
    budget: str = "Not specified"


@app.get("/")
def home():
    return {
        "message": "Startup Idea Validator API is running!"
    }


@app.post("/analyze")
def analyze_startup(data: StartupRequest):

    groq_key = os.getenv("GROQ_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")

    if not groq_key or not tavily_key:
        raise HTTPException(
            status_code=500,
            detail="Groq or Tavily API key is missing."
        )

    if not data.idea.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a startup idea."
        )

    try:
        # Step 1: Search market information using Tavily
        tavily = TavilyClient(api_key=tavily_key)

        search_query = (
            f"Market demand, existing startups, competitors and trends "
            f"for {data.idea} targeting {data.audience} "
            f"in {data.location}"
        )

        search_response = tavily.search(
            query=search_query,
            search_depth="basic",
            max_results=5
        )

        search_results = search_response.get("results", [])

        if not search_results:
            market_information = "No relevant web search results found."
        else:
            market_information = "\n\n".join([
                f"Title: {result.get('title', '')}\n"
                f"URL: {result.get('url', '')}\n"
                f"Information: {result.get('content', '')}"
                for result in search_results
            ])

        # Step 2: Analyze using Groq AI
        llm = ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=0.3,
            api_key=groq_key
        )

        prompt = f"""
You are an experienced startup business analyst.

Analyze this startup idea using the web research below.

Startup Idea: {data.idea}
Target Audience: {data.audience}
Location: {data.location}
Budget: {data.budget}

WEB SEARCH RESULTS:
{market_information}

Prepare a detailed startup validation report.

Include:
1. Startup Idea Overview
2. Problem Being Solved
3. Market Demand Analysis
4. Target Customer Analysis
5. Competitor Analysis
6. SWOT Analysis
7. Business Risks
8. Revenue Model
9. Marketing Strategy
10. MVP Development Cost Estimate
11. Improvement Suggestions
12. Final Feasibility Assessment

Important:
- Use web search information where relevant.
- Do not invent market statistics.
- Clearly identify assumptions and estimates.
- Mention when search information is insufficient.
- Do not treat search results as verified facts without qualification.
"""

        response = llm.invoke(prompt)

        return {
            "success": True,
            "report": response.content,
            "web_results": [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "content": result.get("content", "")
                }
                for result in search_results
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
