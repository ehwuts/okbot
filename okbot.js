const config = require("./okbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);

/* - */
/* Begin Logic Things */
/* - */
var regex_cmd = /^!([a-z]+)(?: |$)/i;

/* begin module includes */
var pingpong = require('./bot_modules/pingpong');
var diceroller = require('./bot_modules/diceroller');
var converter = require('./bot_modules/converter');
/* end module includes */

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

var responseFunc = (id, txt) => {
	discord.createMessage(id, txt);
};

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
				modules[command_handlers[cmd[1]]].respond(cmd, msg, responseFunc);
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