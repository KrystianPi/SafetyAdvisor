import pandas as pd
from langchain.agents.agent_types import AgentType
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI

def ask_dataframe(df: pd.DataFrame, question: str) -> str:
    """
    Ask a question about a dataframe.
    """
    agent = create_pandas_dataframe_agent(
        ChatOpenAI(model="gpt-4.1"),
        df,
        verbose=True,
        agent_type=AgentType.OPENAI_FUNCTIONS,
        allow_dangerous_code=True
    )

    return agent.invoke(question)
