"use client";

import { useStore } from "@/lib/store";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityLog() {
    const { logs, me } = useStore();

    if (me?.role !== "host") {
        console.log("ActivityLog hidden: Not host", me?.role);
        return null;
    }
    console.log("ActivityLog visible");

    return (

        <div className="glass-panel-container max-h-[220px] shrink-0 w-full">
            <div className="glass-tab-header">
                <div className="p-1 bg-white/50 rounded-md shadow-sm">
                    <Activity size={14} className="text-slate-500" />
                </div>
                <span>Activity (Host)</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-4 scrollbar-thin scrollbar-thumb-slate-200">
                {logs.length === 0 ? (
                    <div className="text-slate-400 text-xs italic text-center mt-4">No activity yet</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="text-xs flex items-start space-x-2 text-slate-600 animate-in fade-in slide-in-from-right-2">
                            <span className="shrink-0 pt-0.5">{log.icon || "•"}</span>
                            <div className="flex-1">
                                <span className="text-slate-400 mr-2 text-[10px]">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span>{log.message}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
