import { useEffect, useState } from "react";
import { aiApi } from "../../../shared/api/aiApi";
import type { AiVerdict } from "../../../types";

interface UseSeniorAdviceOptions {
  debounceMs?: number;
  minLength?: number;
}

interface SeniorAdviceState {
  verdict: AiVerdict | null;
  suggestion: string;
  loading: boolean;
  error: string | null;
}

export function useSeniorAdvice(
  title: string,
  content: string,
  options: UseSeniorAdviceOptions = {},
): SeniorAdviceState {
  const debounceMs = options.debounceMs ?? 1000;
  const minLength = options.minLength ?? 10;

  const [state, setState] = useState<SeniorAdviceState>({
    verdict: null,
    suggestion: "",
    loading: false,
    error: null,
  });

  useEffect(() => {
    const trimmed = content.trim();
    if (trimmed.length < minLength) {
      setState(prev => ({ ...prev, verdict: null, suggestion: "", loading: false, error: null }));
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const timer = window.setTimeout(async () => {
      try {
        const res = await aiApi.review({ title, content: trimmed });
        if (cancelled) return;
        setState({
          verdict: res.verdict,
          suggestion: res.suggestion ?? "",
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "AI 리뷰 호출에 실패했습니다.",
        }));
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title, content, debounceMs, minLength]);

  return state;
}

