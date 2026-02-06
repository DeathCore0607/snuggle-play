import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.METERED_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const response = await fetch(`https://snuggleplay.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        if (!response.ok) {
            throw new Error("Failed to fetch ICE servers");
        }
        const iceServers = await response.json();
        return NextResponse.json(iceServers);
    } catch (error) {
        console.error("TURN Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}
