from dotenv import load_dotenv
load_dotenv()
import os
from groq import Groq

client = Groq(api_key=os.environ['GROQ_API_KEY'])
resp = client.chat.completions.create(
    model='openai/gpt-oss-120b',
    messages=[{'role': 'user', 'content': 'Return {"hello": "world"} as JSON only.'}],
    response_format={'type': 'json_object'}
)
print(resp.choices[0].message.content)