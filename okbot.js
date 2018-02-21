const config = require("./okbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);

/* - */
/* Begin Logic Things */
/* - */
var regex_cmd = /^!([a-z]+)(?: |$)/i;

/* begin ping/pong responses */
var pingpong = {
	commands : ["pong", "ping"],
	lastpong : 0,
	sadtimeout : 30000,

	respond : function (cmd, msg) {
		if (msg.content.toLowerCase() === "!pong") {
			var d = new Date();
			if (d.getTime() - this.lastpong < this.sadtimeout) {
				discord.createMessage(msg.channel.id, "Ping. :(");
			} else {
				discord.createMessage(msg.channel.id, "Ping..");
			}
			this.lastpong = d.getTime();
		} else if (msg.content.toLowerCase() === "!ping") {
			discord.createMessage(msg.channel.id, "Ping!");
		}
	}
};
/* end ping/pong responses */

/* begin diceroller */
var diceroller = {
	commands : ["r", "roll"],
	rollmatcher : /^!r(?:oll)? ([0-9]*)d([0-9]+)(?: *(\+|\-) *([0-9]+))?/,
	sadrandint : function (min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	},
	cmp : function (a, b) {
		if (a < b) return -1;
		else return 1;
	},
	respond : function (cmd, msg) {
		var match = msg.content.toLowerCase().match(this.rollmatcher);
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
				var j = this.sadrandint(1, size + 1);
				result += j;
				results.push(j);
				
				++i;
			}
			
			result += offset;
			results.sort(this.cmp);
			
			var outstring = "Rolled **" + result + "** for " + msg.author.username;
			outstring += " (" + count + "d" + size + (offset!==0?(offset < 0?"":"+")+offset:"") + ": " + results.join(",") + ")";
			discord.createMessage(msg.channel.id, outstring);
		}
	}
};
/* end diceroller */

/* begin unit conversion */
// TODO: maybe convert this entire module into a wrapper for https://www.npmjs.com/package/convert-units
// TODO: currency conversions via web call to https://finance.google.com/finance/converter?a=12&from=USD&to=GBP
var converter = {
	commands : ["convert", "c"],
	matcher : /^!(?:c|convert) ([-]?[\d.]+) ?(°c|c|°f|f|k|"|in|inches|cm|centimeters|'|ft|feet|mi|miles|km|kilometers|yd|yards|m|meters|yen|euro|usd|gpb|cad)( [^\w]+)?$/,
	precisionRound : function (v, p=2.0) {
		adj = Math.log10(v)+1;
		if (adj < 1) adj = 1;
		return (new Number(v)).toFixed(p);
	},
	respond : function (cmd, msg) {
		var match = msg.content.toLowerCase().match(this.matcher);
		var count = (match!==null?Number(match[1]) * 1.0:0.0);
		var unit = (match!==null?match[2]:"error");
		switch (unit) {
			case "°c":
			case "c":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + "°C : " + this.precisionRound(count+273.15,2) + "K : " + this.precisionRound(count*1.8+32.0) + "°F");
				break;
			case "°f":
			case "f":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + "°F : " + this.precisionRound((count-32.0)* 0.5 / 0.9) + "°C : " + this.precisionRound((count-32.0)* 0.5 / 0.9 + 273.15) + "K");
				break;
			case "k":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + "K : " + this.precisionRound(count-273.15) + "°C : " + this.precisionRound((count-273.15)*1.8+32.0) + "°F");
				break;
			case "\"":
			case "in":
			case "inches":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " inches : " + this.precisionRound(count/12.0) + " feet : " + this.precisionRound(count*2.54) + " centimeters");
				break;
			case "cm":
			case "centimeters":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " centimeters : " + this.precisionRound(count/2.54) + " inches : " + this.precisionRound(count/2.54/12.0) + " feet");
				break;
			case "'":
			case "ft":
			case "feet":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " feet : " +this.precisionRound(count * 12.0) + " inches : " + this.precisionRound(count / 3.0) + " yards : " + this.precisionRound(count * 12.0 * 2.54) + " centimeters : " + this.precisionRound(count * 12.0 * 2.54 / 100.0) + " meters");
				break;
			case "yd":
			case "yards":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " yards : " + this.precisionRound(count * 3.0) + " feet : " + this.precisionRound(count * 0.9144) + " meters");
				break;
			case "m":
			case "meters":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " meters : " + this.precisionRound(count * 25.0 / 7.62) + " feet : " + this.precisionRound(count / 0.9144) + " yards");
				break;
			case "mi":
			case "miles":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " miles : " + this.precisionRound(count * 1.609344) + " kilometers");
				break;
			case "km":
			case "kilometers":
				discord.createMessage(msg.channel.id, this.precisionRound(count) + " kilometers : " + this.precisionRound(count / 1.609344) + " miles");
				break;
			case "yen":
			case "eur":
			case "usd":
			case "gpb":
			case "cad":			
			default:
				discord.createMessage(msg.channel.id, "Unknown unit. Recognized list is: °C|C|°F|F|K|\"|in|inches|cm|centimeters|'|ft|feet|mi|miles|km|kilometers|yd|yards|m|meters");
		}
	}
};
/* end unit conversion */

/* begin module registration */

var command_handlers = {};
var modules = {
	"pingpong" : pingpong,
	"diceroller" : diceroller,
	"converter" : converter,
};
for (let prop in modules) {
	if (modules.hasOwnProperty(prop)) {
		for (let i = 0; i < modules[prop].commands.length; i++) {
			if (command_handlers[modules[prop].commands[i]] !== undefined) {
				console.log("Warning: multiple modules want command -- " + modules[prop].commands[i]);
			}
			command_handlers[modules[prop].commands[i]] = prop;
		}
	}
}
for (let prop in config.discord_bindings) {
	if (config.discord_bindings.hasOwnProperty(prop)) {
		for (let i = 0; i < config.discord_bindings[prop].modules.length; i++) {
			if (modules[config.discord_bindings[prop].modules[i]] === undefined) {
				console.log("Warning: Unknown module \"" + config.discord_bindings[prop].modules[i] + "\" requested by " + prop + ".");
			}
		}
	}
}

/* end module registration */

/* - */
/* End Logic Things */
/* - */


/* Discord Event Handler Registry */
discord.on("ready", () => {
	console.log(":okbot online.");
});

discord.on("messageCreate", (msg) => {
	if (msg.author.id != discord.user.id && config.discord_bindings[msg.channel.id] !== undefined) {
		var cmd = msg.content.toLowerCase().match(regex_cmd);
		if (cmd !== null) {
			if (command_handlers[cmd[1]] !== undefined && config.discord_bindings[msg.channel.id].modules.indexOf(command_handlers[cmd[1]]) !== -1) {
				console.log("Performing \""+command_handlers[cmd[1]]+":"+ cmd[1] +"\" on \"" + msg.channel.name + ":" + msg.channel.id + "\".");
				modules[command_handlers[cmd[1]]].respond(cmd, msg);
			} else {
				console.log("Unhandled command \"" + cmd[1] +"\" on \"" + msg.channel.name + ":" + msg.channel.id + "\".");
			}
		}
	}
});

discord.connect();

discord.on("error", (e) => { 
	console.log(":err " + e.message); 
});