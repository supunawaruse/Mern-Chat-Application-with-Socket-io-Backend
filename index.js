const express = require('express');
const { connectDB } = require('./config/dbConfig')
const bodyParser = require('body-parser');
const cors = require('cors')
const userRoutes = require('./routes/UserRoutes')
const chatRoutes = require('./routes/ChatRoutes')
const messageRoutes = require("./routes/MessageRoutes")

require('dotenv').config();
connectDB()

const app = express();
const port = parseInt(process.env.PORT) || 5000;
app.use(cors({ credentials: true, origin: true }))
// Body parsing as JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/api/users', userRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/messages', messageRoutes)

const server = app.listen(port, () => console.log(`Server listening on port ${port}!`));

const io = require('socket.io')(server, {
    pingTimeout: 6000,
    cors: {
        origin: "http://localhost:3000",
    }
})

let onlineUsers = [];

const addNewUser = (user, socketId) => {
    !onlineUsers.some((u) => u._id === user._id) && onlineUsers.push({ user, socketId });
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username) => {
    return onlineUsers.find((user) => user.username === username);
};

io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
        addNewUser(userData, socket.id);
        socket.join(userData._id)
        socket.emit("connected")
    })

    socket.on("join chat", (room) => {
        socket.join(room);
    });

    socket.on("leave chat", (room) => {
        socket.leave(room);
    });

    socket.on("typing", (room, userId) => socket.in(room).emit("typing", room, userId));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("change status", (userData, newStatus) => {
        onlineUsers.forEach((u) => {
            if (u.user._id == userData._id) return;
            socket.in(u.user._id).emit("change status received", userData, newStatus)
        })
    })

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;
        
        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id === newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    socket.on("delete message", (newMessageDeleted,newLatestMessage) => {
        var chat = newMessageDeleted.chat;
        if (!chat.users) return console.log("chat.users not defined");
        chat.users.forEach((user) => {
            if (user._id === newMessageDeleted.sender._id) return;
            socket.in(user._id).emit("message deleted", newMessageDeleted,newLatestMessage);
        });
    });

    
    socket.off("setup", (userData) => {
        removeUser(socket.id)
        socket.leave(userData._id);
    });

    socket.on("logout", (userData) => {
        removeUser(socket.id)
        socket.leave(userData._id);
    });

    socket.on("disconnect", () => {
        removeUser(socket.id)
    });

})
