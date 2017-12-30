const config = require("./okbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);

/* - */
/* Begin Logic Things */
/* - */
var regex_cmd = /^!([a-z]+)(?: |$)/i;

/* begin ping/pong responses */
var lastpong = 0;
var sadtimeout = 30000;

function pingpong(msg) {
	if (msg.content.toLowerCase() === "!pong") {
		var d = new Date();
		if (d.getTime() - lastpong < sadtimeout) {
			discord.createMessage(msg.channel.id, "Ping. :(");
		} else {
			discord.createMessage(msg.channel.id, "Ping..");
		}
		lastpong = d.getTime();
	} else if (msg.content.toLowerCase() === "!ping") {
		discord.createMessage(msg.channel.id, "Ping!");
	}
}
/* end ping/pong responses */

/* begin diceroller */
var rollmatcher = /^!r(?:oll)? ([0-9]*)d([0-9]+)(?: *(\+|\-) *([0-9]+))?/;

function sadrandint(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function cmp(a, b) {
	if (a < b) return -1;
	else return 1;
}

function diceroller(msg) {
	var match = msg.content.toLowerCase().match(rollmatcher);
	if (match !== null) {
		var count = (match[1]?match[1]:1)|0;
		var size = match[2]|0;
		var offset = (match[4]?match[4]:0)|0;
		if (match[3] === "-") offset = 0 - offset;
		var results = [];
		
		if (count > 50) {
			results.push = (v) => {};
			results.join = (v) => { return "<lots>"; };
			results.sort = (v) => {};
		}
		
		var result = 0;
		var i = 0;
		while (i < count) {
			var j = sadrandint(1, size + 1);
			result += j;
			results.push(j);
			
			++i;
		}
		
		result += offset;
		results.sort(cmp);
		
		var outstring = "Rolled **" + result + "** for " + msg.author.username;
		outstring += " (" + count + "d" + size + (offset!=0?(offset < 0?"":"+")+offset:"") + ": " + results.join(",") + ")";
		discord.createMessage(msg.channel.id, outstring);
	}
}

/* end diceroller */

/* - */
/* End Logic Things */
/* - */


/* Discord Event Handler Registry */
discord.on("ready", () => {
	console.log(":okbot online.");
});

discord.on("messageCreate", (msg) => {
	if (msg.channel.id === config.discord_channel && msg.author.id != discord.user.id) {
		var cmd = msg.content.toLowerCase().match(regex_cmd);
		
		if (cmd !== null) {
			console.log("Received cmd: " + cmd[1]);
			switch (cmd[1]) {
				case 'pong':
				case 'ping':
					pingpong(msg);
					break;
				case 'r':
				case 'roll':
					diceroller(msg);
			}
		}
	}
});

discord.connect();

discord.on("error", (e) => { 
	console.log(":err " + e.message); 
});