"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlidingPuzzleBoardProps {
    tiles: number[]; // Array of 9 numbers (0-8)
    onTileClick: (index: number) => void;
    imageUrl?: string;
    isSolved: boolean;
}

export default function SlidingPuzzleBoard({
    tiles,
    onTileClick,
    imageUrl = "/puzzle/puzzle.jpg",
    isSolved
}: SlidingPuzzleBoardProps) {
    // We render a 3x3 grid.
    // Each tile is a motion.div
    // We need to map the 1D array to positions.
    // Actually, to animate smoothly, we might want to use layout id or just simple grid with motion.

    // Strategy:
    // The `tiles` array represents the current state at indices 0..8.
    // tiles[i] = correctTileId (0..8).
    // If tiles[i] == 8, it's the empty slot.

    // We want to render the tiles based on their visual position.

    return (
        <div className="relative w-full max-w-[500px] aspect-square bg-white/5 dark:bg-black/20 rounded-xl overflow-hidden border border-white/10 shadow-inner">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
                {tiles.map((tileId, index) => {
                    // tileId is the content (which part of image)
                    // index is the current position

                    // If it's the empty tile (8) and not solved, don't render or render transparent
                    if (tileId === 8 && !isSolved) {
                        return <div key="empty" className="pointer-events-none" />;
                    }

                    // Calculate background position for the tileId
                    // correctRow = floor(tileId / 3)
                    // correctCol = tileId % 3
                    const row = Math.floor(tileId / 3);
                    const col = tileId % 3;

                    return (
                        <motion.button
                            key={tileId} // Key by content to allow Framer Motion to animate position changes
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={() => onTileClick(index)}
                            className={cn(
                                "relative w-full h-full rounded-md overflow-hidden shadow-sm",
                                "hover:brightness-110 transition-[filter]",
                                isSolved ? "cursor-default" : "cursor-pointer"
                            )}
                            whileTap={!isSolved ? { scale: 0.95 } : undefined}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-no-repeat"
                                style={{
                                    backgroundImage: `url('${imageUrl}')`,
                                    backgroundSize: "300% 300%",
                                    backgroundPosition: `${col * 50}% ${row * 50}%` // 0, 50, 100
                                    // Wait.
                                    // 3 columns: 0%, 50%, 100%? 
                                    // If bg is 300%, then:
                                    // col 0: 0%
                                    // col 1: ?
                                    // Let's do calculation:
                                    // background-position-x: -col * 100% (relative to tile size)
                                    // But since we use percentages of the container...
                                    // If we use pixels it's easier. But we want responsive.
                                    // Standard CSS sprite trick:
                                    // width: 100%, height: 100% (of tile)
                                    // bg-size: 300% 300%
                                    // pos: x% y%
                                    // formula: x = (col / (cols - 1)) * 100%
                                    // cols-1 = 2.
                                    // col 0 -> 0%
                                    // col 1 -> 50%
                                    // col 2 -> 100%
                                    // Yes.
                                }}
                            />
                            {/* Optional Number Overlay for debugging or if image fails */}
                            {/* <span className="absolute top-1 left-1 text-xs text-white drop-shadow-md font-bold opaciy-50">{tileId + 1}</span> */}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
