const config = require("./srchat-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);

discord.on("ready", () => {
	console.log(":Pingbot online.");
});

discord.on("messageCreate", (msg) => {
	if (msg.channel.id === config.discord_channel && msg.author.id != discord.user.id) {
		if (msg.content.indexOf("ping") !== -1) {
			discord.createMessage(msg.channel.id, "Ping!");
		}
	}
});

discord.connect();

discord.on("error", (e) => { 
	console.log(":err " + e.message); 
});