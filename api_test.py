import os
from openai import OpenAI
from dotenv import load_dotenv

# .env 파일에 저장된 API 키 로드
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 1. 현재 API 키가 속한 조직 정보 가져오기
try:
    # 현재 내 계정이 접근 가능한 조직 리스트 확인
    # (본인 계정이 여러 조직에 속해 있을 경우 유용합니다)
    print("--- 접속 가능한 조직 목록 ---")
    # 최신 SDK 기준으로는 client.organization_info 대신 아래 방식으로 확인 가능합니다.
    # 하지만 가장 확실한 방법은 실제 호출 후 응답을 보는 것입니다.
    
    # 2. 테스트 호출을 통해 실제 적용된 조직 확인
    response = client.chat.completions.with_raw_response.create(
        model="gpt-4o-mini", # 비용 절감을 위해 가벼운 모델 사용
        messages=[{"role": "user", "content": "test"}]
    )
    
    # 응답 헤더에서 'openai-organization' ID를 확인합니다.
    # 이 ID가 기획자의 조직 ID와 일치하면 기획자의 카드로 결제됩니다.
    org_id = response.headers.get('openai-organization')
    print(f"현재 사용 중인 Organization ID: {org_id}")
    
except Exception as e:
    print(f"오류 발생: {e}")

