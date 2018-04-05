const config = require("./okbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);
var convert = require('convert-units');

/* - */
/* Begin Logic Things */
/* - */
var regex_cmd = /^!([a-z]+)(?: |$)/i;

// TODO - Split modules into actually separate files

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
// TODO: currency conversions via web call to https://finance.google.com/finance/converter?a=12&from=USD&to=GBP (or not since that link died)
var converter = (function(){
	var commands = ["convert", "c"];
	
	/*
	This rounding function is by Mozilla Contributors is licensed under CC-BY-SA 2.5
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round#A_better_solution
	*/
	function round(number, precision) {
		var shift = function (number, precision, reverseShift) {
			if (reverseShift) {
				precision = -precision;
			}  
			numArray = ("" + number).split("e");
			return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
		};
		return shift(Math.round(shift(number, precision, false)), precision, true);
	}
	
	var matcher = /^!(?:c|convert) ([-]?[\d]+(?:[,\.][\d]+)?|measures|possible) *([^ ]+)?(?: +([^ ]+))?$/;
	function respond (cmd, msg) {
		var match = msg.content.match(matcher);
		var result = "";
		
		try {
			if (match !== null && (match[1] == "measures" || match[1] == "possible")) {
				if (match[2] == null) {
					result = "Available categories of measurement are [" + convert().measures().join(", ") + "]";
				} else {
					if (convert().measures().includes(match[2])) {
						result = "Supported units of " + match[2] + " are [" + convert().possibilities(match[2]).join(", ") + "]";
					} else {
						result = "Unsupported category. Available categories of measurement are ["  + convert().measures().join(", ") + "]";
					}					
				}
			} else if (match === null || typeof match[1] == "undefined" || isNaN(match[1] = parseFloat(match[1].replace(",",".")))) {
				result = "Usage: !convert # sourceUnit destUnit | !convert measures | !convert possible <measure>";
			} else {
				if (convert().possibilities().includes(match[2])) {
					if (convert().from(match[2]).possibilities().includes(match[3])) {
						result = round(match[1], 2) + " " + convert().describe(match[2]).plural + " | " + round(convert(match[1]).from(match[2]).to(match[3]), 2) + " " + convert().describe(match[3]).plural + " | possible [" + convert().possibilities(convert().describe(match[2]).measure).join(", ") + "]";
					} else {
						let measure = convert().describe(match[2]).measure;
						if (match[3] === undefined) {
							let best = convert(match[1]).from(match[2]).toBest({ exclude: [match[2]] });
							result = round(match[1], 2) + " " + convert().describe(match[2]).plural + " | " + round(best.val, 2) + " " + best.plural + " | auto from [" + convert().possibilities(measure).join(", ") + "]";
						} else {
							result = "Incompatible conversion. Supported units of " + measure + " are [" + convert().possibilities(measure).join(", ") + "]";
						}
					}
				} else {
					result = "Unsupported unit - " + match[2];
				}
			}
		} catch (e) {
			result = e.message;
		}
		
		discord.createMessage(msg.channel.id, result);
	}
	
	return {"commands": commands, "respond": respond};
})();
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