const { client, getCache, leaveRedis } = require("../models/cache_model");
// put online members into array
const nicknames = [];

function socket (io) {
    io.on("connection", (socket) => {
        // add new user
        socket.on("new user", (data, callback) => {
            // nickname must be unique
            if (nicknames.indexOf(data) !== -1) {
                callback(false);
            } else {
                socket.nickname = data;
                nicknames.push(socket.nickname);
                io.emit("usernames", nicknames);
                callback(true);
            }
        });

        socket.on("chat message", (data) => {
            io.to(data.room).emit("chat message", { nickname: socket.nickname, msg: data.msg });
        });

        socket.on("disconnect", async (data) => {
            if (!socket.nickname) return;
            nicknames.splice(nicknames.indexOf(socket.nickname), 1);
            io.emit("usernames", nicknames);
            const roomInfo = await getCache("all");
            const roomList = JSON.parse(roomInfo);
            let chatRoomName = "";
            for (const i in roomList) {
                if (roomList[i].members.includes(socket.nickname)) {
                    if (i !== "lobby") {
                        chatRoomName = i;
                    }
                }
            }
            if (chatRoomName !== "") {
                const newList = await leaveRedis(chatRoomName, socket.nickname);
                socket.leave(chatRoomName);
                io.emit("room members", newList);
                io.to(chatRoomName).emit("a user leave the room", socket.nickname);
            }
            const onlineList = await leaveRedis("lobby", socket.nickname);
            socket.leave("lobby");
            io.emit("room members", onlineList);
            io.to("lobby").emit("a user leave the room", socket.nickname);
        });

        socket.on("join room", async (roomId) => {
            socket.join(roomId);
            io.to(roomId).emit("a new user join the room", socket.nickname);
            let roomInfo = await getCache("all");
            if (roomInfo === null) { // initialization
                roomInfo = {};
                roomInfo[roomId] = {
                    members: [socket.nickname]
                };
                client.set("all", JSON.stringify(roomInfo));
                io.emit("room members", roomInfo);
            } else {
                // the first person join to the rommId
                const tempRoomInfo = JSON.parse(roomInfo);
                if (tempRoomInfo[roomId] === undefined) {
                    tempRoomInfo[roomId] = {
                        members: [socket.nickname]
                    };
                    client.set("all", JSON.stringify(tempRoomInfo));
                    io.emit("room members", tempRoomInfo);
                } else {
                    tempRoomInfo[roomId].members.push(socket.nickname);
                    client.set("all", JSON.stringify(tempRoomInfo));
                    io.emit("room members", tempRoomInfo);
                }
            }
        });

        socket.on("leave room", async (roomId) => {
            const nameList = await leaveRedis(roomId, socket.nickname);
            console.log(`${socket.nickname} leave room: ${roomId}`);
            socket.leave(roomId);
            io.emit("room members", nameList);
            io.to(roomId).emit("a user leave the room", socket.nickname);
        });

        socket.on("join lobby", () => {
            socket.join("lobby");
        });
    });

    // This will emit the event to all connected sockets
    io.emit("some event", { someProperty: "some value", otherProperty: "other value" });
}

module.exports = {
    socket
};
