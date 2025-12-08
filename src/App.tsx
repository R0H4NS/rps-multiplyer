import {useEffect, useRef, useState} from "react";
import {io, Socket} from "socket.io-client";

type Choice = "rock" | "paper" | "scissors";
const choices: Choice[] = ["rock", "paper", "scissors"];

function getResult(p1: Choice, p2: Choice) {
    if (p1 === p2)
{
    return "Tie!";
}
    if ((p1 === "rock" && p2 === "scissors") || (p1 === "paper" && p2 === "rock") || (p1 === "scissors" && p2 === "paper"))
    {
        return "You win! :)";
    }
    return "You lose... :(";
    }

    export default function App() {
        const [connectedPlayers, setConnectedPlayers] = useState(1);

        const [myChoice, setMyChoice] = useState<Choice | null>(null);
        const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
        const result = myChoice && opponentChoice ? getResult(myChoice, opponentChoice) : "";

        const socketRef = useRef<Socket | null>(null);

        useEffect(() => {
            const sss = io("http://localhost:3001"); // Connects to multiplayer serverrrr
            socketRef.current = sss;
            sss.on("playerCount", (count) => {
                setConnectedPlayers(count);
            });

            sss.on("opponentMove", (move: Choice) => {
                setOpponentChoice(move);
            });

            return () => {
                sss.disconnect();
            };

        }, []);

        const sendChoice = (choice: Choice) => {
            const socket = socketRef.current;
            if (!socket) {
                return;
            }

            setMyChoice(choice);
            setOpponentChoice(null);

            socket.emit("move", choice);
        };


        if (connectedPlayers < 2) {
            return <h1 style={{textAlign: "center"}}>Waiting for opponent...</h1>;
        }

        return (
            <div className="container">
                <h1>Multiplayer Rock, Paper, Scissors</h1>

                <div className="choices">
                    {choices.map((choice) => (
                        <button
                            key={choice}
                            onClick={() => sendChoice(choice)}
                            className="choiceButton"
                        >
                            {choice.toUpperCase()}
                        </button>
                    ))}
                </div>
                {myChoice && <p>You picked: {myChoice}</p>}
                {opponentChoice && <p>Opponent picked: {opponentChoice}</p>}
                {result && <h2>{result}</h2>}
            </div>
        );
    }