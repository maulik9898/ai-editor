"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
}

export function ContextMenu({ items, children }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-background border rounded-md shadow-lg py-1 min-w-[120px]"
            style={{ left: position.x, top: position.y }}
          >
            {items.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-3 py-1 h-auto text-sm"
                onClick={() => handleItemClick(item.onClick)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
