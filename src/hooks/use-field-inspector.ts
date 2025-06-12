"use client";

import { useEffect, useRef, useState } from "react";

interface UseFieldInspectorOptions {
  enabled?: boolean;
  containerSelector?: string;
}

export function useFieldInspector(options: UseFieldInspectorOptions = {}) {
  const { enabled = true, containerSelector = ".mantine-isolated" } = options;
  const [isEnhanced, setIsEnhanced] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTooltipRef = useRef<HTMLElement | null>(null);

  const createTooltip = (fieldElement: Element, fieldName: string) => {
    // Remove any existing tooltip
    removeTooltip();

    const tooltip = document.createElement("div");
    tooltip.className = "field-inspector-tooltip";
    tooltip.textContent = fieldName;

    const arrow = document.createElement("div");
    arrow.className = "field-inspector-tooltip-arrow";

    // Position tooltip
    const rect = fieldElement.getBoundingClientRect();
    const container = document.querySelector(containerSelector);
    const containerRect = container?.getBoundingClientRect();

    if (containerRect) {
      // Position relative to container
      const relativeTop = rect.top - containerRect.top;
      const relativeLeft = rect.left - containerRect.left;
      const centerX = relativeLeft + rect.width / 2;

      // Check if tooltip would go outside container bounds
      const tooltipWidth = Math.min(250, fieldName.length * 8 + 24); // Estimate width
      let finalLeft = centerX - tooltipWidth / 2;

      // Adjust if tooltip would overflow
      if (finalLeft < 10) {
        finalLeft = 10;
      } else if (finalLeft + tooltipWidth > containerRect.width - 10) {
        finalLeft = containerRect.width - tooltipWidth - 10;
      }

      tooltip.style.position = "absolute";
      tooltip.style.top = `${Math.max(10, relativeTop - 45)}px`;
      tooltip.style.left = `${finalLeft}px`;
      tooltip.style.zIndex = "1000";

      // Position arrow
      arrow.style.position = "absolute";
      arrow.style.top = `${Math.max(22, relativeTop - 12)}px`;
      arrow.style.left = `${centerX - 8}px`;
      arrow.style.zIndex = "1001";
    }

    // Add to container
    container?.appendChild(tooltip);
    container?.appendChild(arrow);

    currentTooltipRef.current = tooltip;

    // Trigger animation
    requestAnimationFrame(() => {
      tooltip.classList.add("field-inspector-tooltip-visible");
      arrow.classList.add("field-inspector-tooltip-arrow-visible");
    });
  };

  const removeTooltip = () => {
    const container = document.querySelector(containerSelector);
    const existingTooltips = container?.querySelectorAll(
      ".field-inspector-tooltip, .field-inspector-tooltip-arrow",
    );
    existingTooltips?.forEach((tooltip) => tooltip.remove());
    currentTooltipRef.current = null;
  };

  const handleMouseEnter = (event: Event) => {
    const target = event.target as Element;
    if (!target) return;

    // Find the most specific field element (the one directly under cursor)
    const fieldElement = target.closest("[data-lf-field-name]") as Element;
    if (!fieldElement) return;

    // Check if this is the most inner field element at this position
    const allFieldElements = Array.from(
      document.querySelectorAll("[data-lf-field-name]"),
    );

    // Get all field elements that contain the current target
    const containingFields = allFieldElements.filter(
      (field) =>
        field.contains(target) && field.hasAttribute("data-lf-field-name"),
    );

    // Find the most specific one (smallest bounding box or deepest in DOM)
    const mostSpecificField = containingFields.reduce(
      (most, current) => {
        if (!most) return current;

        // If current is a child of most, current is more specific
        if (most.contains(current)) return current;

        // If most is a child of current, most is more specific
        if (current.contains(most)) return most;

        // Otherwise, compare by element size (smaller is more specific)
        const mostRect = most.getBoundingClientRect();
        const currentRect = current.getBoundingClientRect();
        const mostArea = mostRect.width * mostRect.height;
        const currentArea = currentRect.width * currentRect.height;

        return currentArea < mostArea ? current : most;
      },
      null as Element | null,
    );

    if (mostSpecificField && mostSpecificField === fieldElement) {
      const fieldName = mostSpecificField.getAttribute("data-lf-field-name");
      if (fieldName) {
        // Add active class to current field only
        document.querySelectorAll(".field-inspector-active").forEach((el) => {
          el.classList.remove("field-inspector-active");
        });
        mostSpecificField.classList.add("field-inspector-active");

        createTooltip(mostSpecificField, fieldName);

        // Stop event from bubbling to parent fields
        event.stopPropagation();
      }
    }
  };

  const handleMouseLeave = (event: Event) => {
    const target = event.target as Element;
    const relatedTarget = (event as MouseEvent).relatedTarget as Element;

    // Only remove tooltip if we're not moving to a child element
    if (!target.contains(relatedTarget)) {
      removeTooltip();
      document.querySelectorAll(".field-inspector-active").forEach((el) => {
        el.classList.remove("field-inspector-active");
      });
    }
  };

  const enhanceFields = () => {
    if (!enabled) return;

    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Find all elements with data-lf-field-name
    const fieldElements = container.querySelectorAll("[data-lf-field-name]");

    if (fieldElements.length > 0) {
      // Remove existing event listeners
      fieldElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });

      // Add new event listeners
      fieldElements.forEach((element) => {
        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);
      });

      // Add enhancement class to container
      container.classList.add("field-inspector-enhanced");
      setIsEnhanced(true);

      console.log(`Enhanced ${fieldElements.length} fields for inspection`);
      return true;
    }

    return false;
  };

  const removeEnhancement = () => {
    const container = document.querySelector(containerSelector);
    if (container) {
      // Remove event listeners
      const fieldElements = container.querySelectorAll("[data-lf-field-name]");
      fieldElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
        element.classList.remove("field-inspector-active");
      });

      container.classList.remove("field-inspector-enhanced");
      removeTooltip();
      setIsEnhanced(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      removeEnhancement();
      return;
    }

    // Try to enhance immediately
    const enhanced = enhanceFields();

    if (!enhanced) {
      // Set up observer to watch for DOM changes (Let's Form rendering)
      const targetNode = document.querySelector(containerSelector);

      if (targetNode) {
        observerRef.current = new MutationObserver((mutations) => {
          let shouldEnhance = false;

          mutations.forEach((mutation) => {
            if (
              mutation.type === "childList" &&
              mutation.addedNodes.length > 0
            ) {
              // Check if any added nodes contain field elements
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (
                    element.hasAttribute?.("data-lf-field-name") ||
                    element.querySelector?.("[data-lf-field-name]")
                  ) {
                    shouldEnhance = true;
                  }
                }
              });
            }
          });

          if (shouldEnhance) {
            // Debounce enhancement
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
              enhanceFields();
            }, 100);
          }
        });

        observerRef.current.observe(targetNode, {
          childList: true,
          subtree: true,
        });
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      removeEnhancement();
    };
  }, [enabled, containerSelector]);

  return {
    isEnhanced,
    enhanceFields,
    removeEnhancement,
  };
}
