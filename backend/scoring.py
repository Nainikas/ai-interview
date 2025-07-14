# backend/scoring.py

SCORE_WEIGHTS = {
    "relevance": 2,
    "accuracy": 3,
    "completeness": 2,
    "clarity": 1,
}

def adaptive_score(subscores, weights=SCORE_WEIGHTS):
    total = sum(subscores[key] * weights.get(key, 1) for key in subscores)
    return round(total / sum(weights.values()), 3)

def compute_subscores(question: str, answer: str) -> dict:
    ans = answer.lower()
    q = question.lower()
    scores = {}
    scores["relevance"] = float(any(word in ans for word in q.split())) or 0.6
    scores["accuracy"] = 0.9 if "correct" in ans or "is" in ans else 0.6
    n_words = len(answer.strip().split())
    scores["completeness"] = min(1.0, n_words / 25) if n_words > 5 else 0.4
    scores["clarity"] = 0.8 if any(x in ans for x in ["because", "for example", "i think"]) or "." in answer else 0.5
    return scores

def check_hallucination(question: str, answer: str) -> str:
    if "not sure" in answer.lower() or "maybe" in answer.lower():
        return "Speculative"
    elif len(answer.strip()) < 5:
        return "Hallucination"
    else:
        return "Valid"