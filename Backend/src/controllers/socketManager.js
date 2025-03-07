import { Server } from 'socket.io';


const connections = {};
const timeOnline = {};
const messages = {};



const connectToSocket = (server) => {
    const io = new Server(server,{
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders:"*",
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log("User connected");
        socket.on("join-call", (path) =>{
            if(connections[path] === undefined){
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();
            
            // Emit to all users in the room with the updated connections array
            connections[path].forEach(socketId => {
                io.to(socketId).emit("user-joined", socket.id, connections[path]);
            });

        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // The current code is looking for data.userToSignal which doesn't exist in the frontend implementation
            // Let's fix to use the room concept instead
            
            // Find which room this socket is in
            const matchingRoom = Object.entries(connections).find(([roomKey, sockets]) => 
              sockets.includes(socket.id)
            )?.[0];
            
            if(matchingRoom) {
              if(messages[matchingRoom] === undefined) {
                messages[matchingRoom] = [];
              }
              messages[matchingRoom].push({"sender": sender, "data": data, "socket-id-sender": socket.id});
              console.log("message", matchingRoom, ":", sender, data);
              
              connections[matchingRoom].forEach(socketId => {
                io.to(socketId).emit("chat-message", data, sender, socket.id);
              });
            }
        });

        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date());
            var key;

            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; a++) {
                    if(v[a] === socket.id) {
                        key = k;
                        for(let a = 0; a < connections[key].length; a++) {
                            io.to(connections[key][a]).emit("user-left", socket.id);
                        }
                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);
                        if(connections[key].length === 0) {
                            delete connections[key];
                        }
                    }
                }
            }
        });
    });

    return io;
}
export default connectToSocket;