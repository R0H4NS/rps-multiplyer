import express from "express";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3002;

// Serve static files from "client" folder
app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client/index.html"));
});

const io = new Server(server, {
    cors: { origin: "*" },
});

let players = [];
let moves = {};

// Return result text and type
function getResult(a, b) {
    if (a === b) return { text: "Tie!", type: "tie" };
    if (
        (a === "rock" && b === "scissors") ||
        (a === "paper" && b === "rock") ||
        (a === "scissors" && b === "paper")
    )
        return { text: "You win!", type: "win" };
    return { text: "You lose!", type: "lose" };
}

io.on("connection", (socket) => {
    players.push(socket.id);
    io.emit("playerCount", players.length);

    socket.on("move", (choice) => {
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
                    result: r1.text,
                    resultType: r1.type, // added
                });

                io.to(p2).emit("gameResult", {
                    yourChoice: moves[p2],
                    opponentChoice: moves[p1],
                    result: r2.text,
                    resultType: r2.type, // added
                });

                moves = {};
            }
        }
    });

    socket.on("disconnect", () => {
        players = players.filter((id) => id !== socket.id);
        delete moves[socket.id];
        io.emit("playerCount", players.length);
    });
});

server.listen(PORT, () => console.log("Server running on port", PORT));
