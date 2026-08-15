import { useEffect, useState } from "react";

const CACHE_KEY = "uncover64:github-stars";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let inFlight: Promise<number | null> | null = null;

function loadCache(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, at } = JSON.parse(raw) as { value: number; at: number };
    if (Date.now() - at > CACHE_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}

function saveCache(value: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function fetchStars(): Promise<number | null> {
  if (!inFlight) {
    inFlight = fetch("https://api.github.com/repos/dimasbaguspm/uncover64", {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        const n = typeof json?.stargazers_count === "number" ? json.stargazers_count : null;
        if (n !== null) saveCache(n);
        return n;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** GitHub stargazer count for the repo, cached in localStorage for 24h. */
export function useGithubStars(): number | null {
  const [stars, setStars] = useState<number | null>(() => loadCache());

  useEffect(() => {
    let active = true;
    void fetchStars().then((n) => {
      if (active) setStars(n);
    });
    return () => {
      active = false;
    };
  }, []);

  return stars;
}
