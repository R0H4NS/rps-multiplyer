import { Server } from "socket.io";

type Choice = "rock" | "paper" | "scissors";

const io = new Server(3002, {
    cors: { origin: "http://localhost:5173" }
});

let players: string[] = [];
let moves: Record<string, Choice> = {};

function getResult(a: Choice, b: Choice) {
    if (a === b) return "Tie!";
    if (
        (a === "rock" && b === "scissors") ||
        (a === "paper" && b === "rock") ||
        (a === "scissors" && b === "paper")
    ) {
        return "You win!";
    }
    return "You lose!";
}

io.on("connection", (socket) => {
    players.push(socket.id);
    io.emit("playerCount", players.length);

    socket.on("move", (choice: Choice) => {
        // prevent double-picking
        if (moves[socket.id]) return;

        moves[socket.id] = choice;

        if (players.length === 2) {
            const [p1, p2] = players;

            if (moves[p1] && moves[p2]) {
                const r1 = getResult(moves[p1], moves[p2]);
                const r2 = getResult(moves[p2], moves[p1]);

                io.to(p1).emit("gameResult", {
                    yourChoice: moves[p1],
                    opponentChoice: moves[p2],
                    result: r1
                });

                io.to(p2).emit("gameResult", {
                    yourChoice: moves[p2],
                    opponentChoice: moves[p1],
                    result: r2
                });

                // reset round
                moves = {};
            }
        }
    });

    socket.on("disconnect", () => {
        players = players.filter(id => id !== socket.id);
        delete moves[socket.id];
        io.emit("playerCount", players.length);
    });
});

console.log(" Socket.IO running on port 3002");
