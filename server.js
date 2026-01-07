import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3002;

// Serve client
app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client/index.html"));
});

let players = [];
let moves = {};

function getResult(a, b) {
    if (a === b) return { text: "Tie!", type: "tie" };
    if (
        (a === "rock" && b === "scissors") ||
        (a === "paper" && b === "rock") ||
        (a === "scissors" && b === "paper")
    ) {
        return { text: "You win!", type: "win" };
    }
    return { text: "You lose!", type: "lose" };
}

io.on("connection", (socket) => {
    if (players.length >= 2) {
        socket.disconnect();
        return;
    }

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
                    ...r1,
                });

                io.to(p2).emit("gameResult", {
                    yourChoice: moves[p2],
                    opponentChoice: moves[p1],
                    ...r2,
                });

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

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
