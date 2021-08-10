const socket = io();
const nickWrap = document.getElementById("nickWrap");
const nickForm = document.getElementById("setNick");
const nickError = document.getElementById("nickError");
const nickBox = document.getElementById("nickName");
const nameList = document.getElementById("nameList");
const chatRoom = document.getElementById("chatRoom");
const messages = document.getElementById("messages");
const groupList = document.getElementById("groupList");
const title = document.getElementById("title");
const form = document.getElementById("form");
const input = document.getElementById("input");
const joinRoom = document.getElementsByClassName("joinRoom");
const leaveRoom = document.getElementsByClassName("leaaveRoom");
let myName = "";
let roomId = "lobby";

// input user's nickaname and enter to lobby
nickForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (nickBox.value) {
        myName = nickBox.value;
        socket.emit("new user", nickBox.value, (data) => {
            if (data) {
                nickWrap.style = "display:none";
                form.style = "display:block";
                chatRoom.style = "display:block";
                groupList.style = "display:block";
                nameList.style = "display:block";
                title.innerHTML = "Chat Room - Lobby";
                socket.emit("join room", roomId);
            } else {
                nickError.innerHTML = "That username is reapted!Please try again~";
            }
        });
        nickBox.value = "";
    }
});

// send meassage
form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value) {
        const message = {
            room: roomId,
            msg: input.value
        };
        socket.emit("chat message", message);
        input.value = "";
    }
});

// Online List
socket.on("usernames", function (data) {
    let html = "Online List:<br>";
    for (const i of data) {
        if (i === myName) {
            html += i + " ★" + "<br>";
        } else {
            html += i + "<br>";
        }
    }
    nameList.innerHTML = html;
});

socket.on("chat message", function (data) {
    const item = document.createElement("li");
    item.innerHTML = `<b>${data.nickname}:</b> ${data.msg} </br>`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// join room
for (let i = 0; i < joinRoom.length; i++) {
    joinRoom[i].addEventListener("click", function () {
        socket.emit("leave room", roomId);
        roomId = joinRoom[i].id;
        socket.emit("join room", roomId);
        alert(`Weclome to ${roomId}`);
        title.innerHTML = `Chat Room - ${roomId}`;
        const items = document.querySelectorAll("li");
        for (let i = 0; i < items.length; i++) {
            messages.removeChild(items[i]);
        }
    });
}

socket.on("a new user join the room", function (name) {
    const item = document.createElement("li");
    item.innerHTML = `${name} join the ${roomId}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// leave room
for (let i = 0; i < leaveRoom.length; i++) {
    leaveRoom[i].addEventListener("click", function (event) {
        if (event.target.id !== roomId) {
            alert(`You are not in the ${event.target.id}`);
            return;
        }
        socket.emit("leave room", roomId);
        socket.emit("join lobby", roomId);
        alert("already left");
        const items = document.querySelectorAll("li");
        for (let i = 0; i < items.length; i++) {
            messages.removeChild(items[i]);
        }
        title.innerHTML = "Chat Room - Lobby";
        roomId = "lobby";
    });
}

socket.on("a user leave the room", function (name) {
    const item = document.createElement("li");
    item.innerHTML = `${name} leave the ${roomId}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("room members", function (data) {
    if (data.Room1 !== undefined) {
        const room1MembersList = document.getElementById("memberRoom1");
        room1MembersList.innerHTML = "Members: ";
        for (const i of data.Room1.members) {
            room1MembersList.innerHTML += i + " ";
        }
    }
    if (data.Room2 !== undefined) {
        const room2MembersList = document.getElementById("memberRoom2");
        room2MembersList.innerHTML = "Members: ";
        for (const i of data.Room2.members) {
            room2MembersList.innerHTML += i + " ";
        }
    }
    if (data.Room3 !== undefined) {
        const room3MembersList = document.getElementById("memberRoom3");
        room3MembersList.innerHTML = "Members: ";
        for (const i of data.Room3.members) {
            room3MembersList.innerHTML += i + " ";
        }
    }
});
