const { client, getCache, leaveRedis } = require("../models/cache_model");
const nicknames = [];

function socket (io) {
    io.on("connection", (socket) => {
        socket.on("new user", (data, callback) => {
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
                // socket.to(chatRoomName).emit("user left");
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
            if (roomInfo === null) { // 給予初始值
                roomInfo = {};
                roomInfo[roomId] = {
                    members: [socket.nickname]
                };
                client.set("all", JSON.stringify(roomInfo));
                io.emit("room members", roomInfo);
            } else {
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
            // socket.join("lobby");
            // const memberInfo = JSON.parse(await getCache("all"));
            // console.log("+++++++++++++");
            // console.log(memberInfo.lobby);
            // memberInfo.lobby.members.push(socket.nickname);
            // client.set("all", JSON.stringify(memberInfo));
            // io.to("lobby").emit("a new user join the room", socket.nickname);
        });

        socket.on("join lobby", () => {
            // redis update HERE!!!
            socket.join("lobby");
        });
    });

    // This will emit the event to all connected sockets
    io.emit("some event", { someProperty: "some value", otherProperty: "other value" });
}

module.exports = {
    socket
};
