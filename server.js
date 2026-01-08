import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.resolve("")));

let waitingQueue = []; // queue for unmatched players
let games = {}; // store active games: gameId -> {player1, player2, moves}

const generateGameId = () => Math.random().toString(36).substring(2, 10);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Add to queue
    waitingQueue.push(socket);

    // Check if we can start a game
    if (waitingQueue.length >= 2) {
        const player1 = waitingQueue.shift();
        const player2 = waitingQueue.shift();
        const gameId = generateGameId();

        games[gameId] = {
            player1: player1.id,
            player2: player2.id,
            moves: {}
        };

        // Notify both clients the game is ready
        [player1, player2].forEach((player) => {
            player.emit("playerCount", 2);
            player.gameId = gameId; // attach gameId to socket
        });
    } else {
        socket.emit("playerCount", 1);
    }

    socket.on("move", (choice) => {
        const game = games[socket.gameId];
        if (!game) return;

        // Record move if not already locked
        if (!game.moves[socket.id]) {
            game.moves[socket.id] = choice;

            // If both players made a move, determine result
            if (Object.keys(game.moves).length === 2) {
                const p1Choice = game.moves[game.player1];
                const p2Choice = game.moves[game.player2];

                const determineResult = (mine, theirs) => {
                    if (mine === theirs) return "tie";
                    if (
                        (mine === "rock" && theirs === "scissors") ||
                        (mine === "paper" && theirs === "rock") ||
                        (mine === "scissors" && theirs === "paper")
                    ) return "win";
                    return "lose";
                };

                // Send results to both
                io.to(game.player1).emit("gameResult", {
                    yourChoice: p1Choice,
                    opponentChoice: p2Choice,
                    text: determineResult(p1Choice, p2Choice) === "win" ? "You Win!" :
                        determineResult(p1Choice, p2Choice) === "lose" ? "You Lose!" : "Tie!",
                    type: determineResult(p1Choice, p2Choice)
                });

                io.to(game.player2).emit("gameResult", {
                    yourChoice: p2Choice,
                    opponentChoice: p1Choice,
                    text: determineResult(p2Choice, p1Choice) === "win" ? "You Win!" :
                        determineResult(p2Choice, p1Choice) === "lose" ? "You Lose!" : "Tie!",
                    type: determineResult(p2Choice, p1Choice)
                });

                // Delete the game after best-of-1
                delete games[socket.gameId];
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove from queue if waiting
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);

        // Notify opponent if in active game
        if (socket.gameId && games[socket.gameId]) {
            const game = games[socket.gameId];
            const opponentId = game.player1 === socket.id ? game.player2 : game.player1;
            io.to(opponentId).emit("full", "Opponent disconnected.");
            delete games[socket.gameId];
        }
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.resolve("./index.html"));
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});
