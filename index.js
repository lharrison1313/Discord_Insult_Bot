//todo make the read and writes to insult files asynchronous
//todo make it so users can chose a specific insult by index

const Discord = require("discord.js"); 
const fs = require("fs"); 
const csv = require("csv-parser");
const client = new Discord.Client(); 
const token = fs.readFileSync("token.txt").toString(); 
var insults = [];
const whitelist = ["742204381142843462","807816089156845578"]

//sends an insult to the current channel
function insult(message){
	//getting random number between 0 and length of insults
	let random = Math.floor(Math.random()*Math.floor(insults.length));
	//getting command
	let command = message.content.split(" ");

	//if the command has user argument build a personalised insult
	if(command.length > 1 && isNaN(command[1])){
		let insult = command[1] + " " + insults[random].insult;
		message.channel.send(insult, {tts: true});
	}
	//if the command request specific insult index
	else if(command.length > 1 && !isNaN(command[1]) && parseInt(command[1]) > 0 && parseInt(command[1]) <= insults.length){
		if(command.length > 2){
			let insult = command[2] + " " + insults[parseInt(command[1])-1].insult;
			message.channel.send(insult,{tts: true});
		}
		else{
			message.channel.send(insults[parseInt(command[1])-1].insult,{tts: true});
		}
	}
	//default
	else{
		message.channel.send(insults[random].insult, {tts: true});
	}
}

//adds an insult to the insults database
function addInsult(message){
	if(allowed(message)){
		let command = message.content.split(" ");
		let insult = "\ngeneral,";
		if(command.length > 1){
			command.shift();
			command.forEach((element) => {
				if(!element.includes(',') && !element.includes("\n")){
					insult += element + " ";
				}
			})
			fs.appendFileSync("insults.csv", insult);
			message.channel.send("New insult was added you big dummie!")
			updateInsults();
		}
	}
	
}

function deleteInsult(message){
	let command = message.content.split(" ");
	if(allowed(message) && command.length > 1 && !isNaN(command[1]) && parseInt(command[1]) > 0 && parseInt(command[1]) <= insults.length){
		let text = "type,insult";
		let index = parseInt(command[1]);

		insults.splice(index-1,1);
		insults.forEach((item) => {
			text += "\n"+item.type+","+item.insult;
		});
		fs.writeFileSync("insults.csv",text);
		updateInsults();
		message.channel.send("Insult "+ index +" was deleted ya big doofus!")
	}
	
}

//allows users to retrieve a list of insults used by the bot using a page number, start, or end
function listInsults(message){
	var command =  message.content.split(" ");
	var list = [];
	var page = 1;
	var index = 1;

	if(command.length > 1){
		
		if(command[1] == "end"){
			if(insults.length < 10){
				list = insults;
			}
			else{
				list = insults.slice(insults.length-(insults.length%10),insults.length);
				page = Math.ceil(insults.length/10);
				index = insults.length-(insults.length%10)+1;
			}
		}
		else if(command[1] == "start"){
			list = insults.slice(0,10);
		}
		else if(!isNaN(command[1]) && parseInt(command[1]) > 0){
			page = parseInt(command[1])
			if(insults.length > 10*page){
				list = insults.slice((page*10)-10,page*10);
				index = (page*10)-9
			}
			else{
				list = insults.slice(insults.length-(insults.length%10),insults.length);
				page = Math.ceil(insults.length/10);
				index = insults.length-(insults.length%10)+1;
			}
		}
		else{
			list = insults.slice(0,10);
		}

		
		var list_text = "Insult list page " + page + ":\n";

		list.forEach((item) =>{
			list_text += index + ") " + item.insult + "\n";
			index++;
		})
		message.channel.send(list_text);
	}

}

//fills the insult array with values from insults.csv
function updateInsults(){
	//zeroing out insult array
	insults.length = 0;
	//reading the insult file
	fs.createReadStream('insults.csv')
	.pipe(csv())
	.on('data', (data) => insults.push(data))
}

//checks to see if the server has allowed privilege
function allowed(message){
	if(whitelist.includes(message.guild.id)){
		return true;
	}
	else{
		message.channel.send("Sorry your server isnt allowed to do that ya big silly!");
		return false;
	}

}

function help(message){
	message.channel.send("Insult bot is a bot that insults your friends!\nCommands:\n!insult: sends a random insult\n!insult <name>: insults a specific name\n!add-insult <insult>: adds an insult to the database\n!list-insults <page#> or <start/end>: prints a page of insults from the database\n!delete-insult <insult#>: deletes an insult from the databse")
}

//creating command map
let commands = new Map();
commands.set("!insult", insult);
commands.set("!add-insult", addInsult)
commands.set("!help", help)
commands.set("!list-insults",listInsults)
commands.set("!delete-insult",deleteInsult);


client.once("ready", () => { 
	updateInsults();
	console.log("Ready!");
});

client.on("message", (message) =>{
	const command = message.content.split(" ")[0];
	if(commands.has(command)){
		commands.get(command)(message)
	}
})

client.login(token);