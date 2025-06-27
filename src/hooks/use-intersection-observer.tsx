import { useEffect, useRef, useCallback } from "react";

interface UseIntersectionObserverProps {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  targetRef: React.RefObject<HTMLElement | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = "0px",
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}): UseIntersectionObserverReturn {
  const targetRef = useRef<HTMLElement>(null);
  const entryRef = useRef<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isIntersectingRef = useRef(false);
  const frozenRef = useRef(false);

  const updateEntry = useCallback(
    (entry: IntersectionObserverEntry) => {
      entryRef.current = entry;
      isIntersectingRef.current = entry.isIntersecting;

      if (freezeOnceVisible && entry.isIntersecting) {
        frozenRef.current = true;
      }
    },
    [freezeOnceVisible],
  );

  useEffect(() => {
    const target = targetRef.current;
    if (!target || (freezeOnceVisible && frozenRef.current)) {
      return;
    }

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          updateEntry(entry);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      },
    );

    observer.observe(target);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [threshold, root, rootMargin, updateEntry, freezeOnceVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    targetRef,
    isIntersecting: isIntersectingRef.current,
    entry: entryRef.current,
  };
}
