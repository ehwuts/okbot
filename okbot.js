const config = require("./okbot-config.js");

const Eris = require("eris");

var discord = new Eris(config.discord_token);

/* Begin Module Registration */
var regex_strip_module = /[\/\\\.]/;

function loadModule(module) {
	let pathModule = './bot_modules/' + module.replace(regex_strip_module, '');
	//console.log('Loading module ' + pathModule);
	try {
		return require(pathModule);
	} catch (e) {
		console.log(e);
		return false;
	}
}

var command_handlers = {};
var modules = {};
for (let prop in config.discord_bindings) {
	if (config.discord_bindings.hasOwnProperty(prop)) {
		for (let i = 0; i < config.discord_bindings[prop].modules.length; i++) {
			let m = config.discord_bindings[prop].modules[i];
			if (modules[m] === undefined) {
				mm = loadModule(m);
				if (mm) {
					modules[m] = mm;
				} else {
					console.log("Warning: Unknown module \"" + m.replace(regex_strip_module, '') + "\" requested by " + prop + ".");
				}
			}
		}
	}
}
for (let prop in modules) {
	if (modules.hasOwnProperty(prop)) {
		for (let i = 0; i < modules[prop].commands.length; i++) {
			if (command_handlers[modules[prop].commands[i]] !== undefined) {
				console.log("Warning: multiple modules want command -- " + modules[prop].commands[i]);
			}
			//console.log('Registering command ' + modules[prop].commands[i] + ' for module ' + prop);
			command_handlers[modules[prop].commands[i]] = prop;
		}
	}
}

var responseFunc = (id, txt) => {
	discord.createMessage(id, txt);
};

/* End Module Registration */

/* Discord Event Handler Registry */
var regex_cmd = /^!([\w\d]+)(?: |$)/i;

discord.on("ready", () => {
	console.log(":okbot online.");
});

discord.on("messageCreate", (msg) => {
	if (msg.author.id != discord.user.id && config.discord_bindings[msg.channel.id] !== undefined) {
		var cmd = msg.content.toLowerCase().match(regex_cmd);
		if (cmd !== null) {
			if (cmd[1] == 'commands' || cmd[1] == 'modules') {
				let list = [];
				let outstr = '';
				for (let i = 0; i < config.discord_bindings[msg.channel.id].modules.length; i++) {
					//console.log('module ' + config.discord_bindings[msg.channel.id].modules[i]);
					for (let j = 0; j < modules[config.discord_bindings[msg.channel.id].modules[i]].commands.length; j++) {
						//console.log('command ' + modules[config.discord_bindings[msg.channel.id].modules[i]].commands[j]);
						list.push(modules[config.discord_bindings[msg.channel.id].modules[i]].commands[j]);
					}
					outstr += config.discord_bindings[msg.channel.id].modules[i] + ' (' + list.join(', ') + '), ';
					list = [];
				}
				if (outstr == '') {
					responseFunc(msg.channel.id, 'There are no modules active on this channel.');
				} else {
					responseFunc(msg.channel.id, 'The modules active on this channel are: ' + outstr.substr(0, outstr.length - 2));
				}
			} else if (command_handlers[cmd[1]] !== undefined && config.discord_bindings[msg.channel.id].modules.indexOf(command_handlers[cmd[1]]) !== -1) {
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