import { Server } from 'socket.io';

const connections = {};
const timeOnline = {};
const messages = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: "*",
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 5000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    io.on('connection', (socket) => {
        console.log("User connected with ID:", socket.id);

        // Modify the join-call handler to improve reliability
        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            
            // Check if this socket is already in this room
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
                timeOnline[socket.id] = new Date();
                
                // Add a small delay before notifying everyone
                // This gives clients time to set up local streams
                setTimeout(() => {
                    // Emit to all users in the room with the updated connections array
                    connections[path].forEach(socketId => {
                        io.to(socketId).emit("user-joined", socket.id, connections[path]);
                    });
                }, 500);
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // Find which room this socket is in
            const matchingRoom = Object.entries(connections).find(([roomKey, sockets]) =>
                sockets.includes(socket.id)
            )?.[0];

            if (matchingRoom) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                
                // Store the message in server's memory
                messages[matchingRoom].push({ "sender": sender, "data": data, "socket-id-sender": socket.id });
                console.log("message", matchingRoom, ":", sender, data);

                // Send to all clients EXCEPT the sender
                connections[matchingRoom].forEach(socketId => {
                    if (socketId !== socket.id) { // Don't send back to sender
                        io.to(socketId).emit("chat-message", data, sender, socket.id);
                    }
                });
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("User disconnected:", socket.id, "Reason:", reason);
            let roomKey = null;

            // Find which room this socket was in
            for (const [k, v] of Object.entries(connections)) {
                const index = v.indexOf(socket.id);
                if (index !== -1) {
                    roomKey = k;
                    break;
                }
            }

            if (roomKey) {
                console.log("User was in room:", roomKey);

                // Notify all other users in the room
                connections[roomKey].forEach(socketId => {
                    if (socketId !== socket.id) {
                        io.to(socketId).emit("user-left", socket.id);
                    }
                });

                // Remove user from connections
                connections[roomKey] = connections[roomKey].filter(id => id !== socket.id);

                // Clean up empty rooms
                if (connections[roomKey].length === 0) {
                    console.log("Room is now empty, removing:", roomKey);
                    delete connections[roomKey];
                }
            }
        });
    });

    return io;
}
export default connectToSocket;