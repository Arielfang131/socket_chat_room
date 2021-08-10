require("dotenv").config();
const redis = require("redis");
const { REDISPORT } = process.env || 6379; // redis port setting
const { REDISHOST } = process.env;
const client = redis.createClient(REDISPORT, REDISHOST); // create redis client

function getCache (key) { // used in async function
    return new Promise((resolve, reject) => {
        client.get(key, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

async function leaveRedis (roomId, nickname) {
    const roomInfo = await getCache("all");
    const membersData = JSON.parse(roomInfo);
    membersData[roomId].members.splice(membersData[roomId].members.indexOf(nickname), 1); // remove nickname from mimbers
    client.set("all", JSON.stringify(membersData));
    return membersData;
};

module.exports = {
    client,
    getCache,
    leaveRedis
};
