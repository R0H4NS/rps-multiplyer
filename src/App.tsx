import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

type Choice = "rock" | "paper" | "scissors";
const choices: Choice[] = ["rock", "paper", "scissors"];

export default function App() {
    const [players, setPlayers] = useState(1);
    const [myChoice, setMyChoice] = useState<Choice | null>(null);
    const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState("");
    const [locked, setLocked] = useState(false);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io("http://localhost:3001");
        socketRef.current = socket;

        socket.on("connect", () => console.log("Connected. Socket ID: " + socket.id));
        socket.on("playerCount", (count) => setPlayers(count));
        socket.on("gameResult", (data: { yourChoice: Choice; opponentChoice: Choice; result: string }) => {
            setMyChoice(data.yourChoice);
            setOpponentChoice(data.opponentChoice);
            setResult(data.result);
        });

        // Correct cleanup function
        return () => {
            socket.disconnect();
        };
    }, []);
    function play(choice: Choice) {
        if (!socketRef.current || locked) return;

        setMyChoice(choice);
        setLocked(true);
        socketRef.current.emit("move", choice);
    }

    function nextRound() {
        setMyChoice(null);
        setOpponentChoice(null);
        setResult("");
        setLocked(false);
    }

    if (players < 2) {
        return <h1 className="waiting">Waiting for opponent...</h1>;
    }

    return (
        <div className="container">
            <h1>Rock Paper Scissors</h1>

            <div className="choices">
                {choices.map(c => (
                    <button
                        key={c}
                        disabled={locked}
                        onClick={() => play(c)}
                    >
                        {c.toUpperCase()}
                    </button>
                ))}
            </div>

            {myChoice && <p>You picked: {myChoice}</p>}
            {opponentChoice && <p>Opponent picked: {opponentChoice}</p>}
            {result && (
                <h2
                    className={`result ${
                        result.includes("win")
                            ? "win"
                            : result.includes("lose")
                                ? "lose"
                                : "tie"
                    }`}
                >
                    {result}
                </h2>
            )}


            {result && (
                <button className="next" onClick={nextRound}>
                    Next Round
                </button>
            )}
        </div>
    );
}
