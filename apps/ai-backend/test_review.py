import sys
import os

# app 디렉토리를 경로에 추가하여 main 모듈을 임포트할 수 있게 함
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from main import _review_text
except ImportError:
    print("Error: Could not import _review_text from app.main")
    sys.exit(1)

def test_ai_logic():
    test_cases = [
        ("안녕하세요, 좋은 아침입니다!", "OK"),
        ("이거 진짜 짜증나네요, 빡치네.", "SOFT_WARN"),
        ("너 진짜 병신이냐? 꺼져.", "BLOCK"),
        ("정말 화가 나지만 참아볼게요.", "SOFT_WARN"),
        ("컴퓨터공학부 전공 서적 팝니다.", "OK"),
    ]

    print("=== Dageolgo AI Logic Test ===\n")
    
    passed = 0
    for text, expected in test_cases:
        result = _review_text(text)
        print(f"Input: {text}")
        print(f"Verdict: {result.verdict}")
        print(f"Scores: Toxicity={result.scores.toxicity}, Harassment={result.scores.harassment}")
        print(f"Suggestion: {result.suggestion}")
        
        if result.verdict == expected:
            print("Result: [PASS]")
            passed += 1
        else:
            print(f"Result: [FAIL] (Expected: {expected})")
        print("-" * 30)

    print(f"\nFinal Result: {passed}/{len(test_cases)} passed.")

if __name__ == "__main__":
    test_ai_logic()
