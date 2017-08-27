const config = require("./pingbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);
var lastpong = 0;
var sadtimeout = 30000;

discord.on("ready", () => {
	console.log(":Pingbot online.");
});

discord.on("messageCreate", (msg) => {
	if (msg.channel.id === config.discord_channel && msg.author.id != discord.user.id) {
		if (msg.content.toLowerCase().indexOf("pong") !== -1) {
			var d = new Date();
			if (d.getTime() - lastpong > sadtimeout) {
				discord.createMessage(msg.channel.id, "Ping..");
			} else {
				discord.createMessage(msg.channel.id, "Ping. :(");
			}
			lastpong = d.getTime();
		} else if (msg.content.toLowerCase().indexOf("ping") !== -1) {
			discord.createMessage(msg.channel.id, "Ping!");
		}
	}
});

discord.connect();

discord.on("error", (e) => { 
	console.log(":err " + e.message); 
});