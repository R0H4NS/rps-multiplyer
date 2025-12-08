import { Server } from "socket.io"

const io = new Server(3001, {
    cors: {
        origin: "http://localhost:5173",
    },
});


let players: any[] = []; //ts stores connected socket id

io.on('connection', (socket) => {
    console.log("Player connected", socket.id);
    players.push(socket.id);

    io.emit('playerCount', players.length); // tells ppl abt how many playas

    socket.on("move", (choice) => {
        console.log("Move from", socket.id, ":", choice);

        socket.broadcast.emit("opponentMove", choice); //sends move to other dude
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        players = players.filter((id) => id !== socket.id); //remove twin from array
        io.emit('playerCount', players.length); //updates everybody w player amnttt
    });
});

console.log("Socket.IO server running on port 3001"); // logs when server online