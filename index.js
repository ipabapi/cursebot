const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, WebhookClient } = require('discord.js');
const { token } = require('./config.json');
const {MongoClient} = require('mongodb');
const nlp = require('compromise');


const setPronouns =(user) => ({
    
    'me': user,
    'my': `${user}'s`,
    'mine': `${user}'s`,
    'myself': `${user}'s self`,
    'am I': `is ${user}`,
    'im': `${user} is`,
    'i\'m': `${user} is`,
    'i am': `${user} is`,
    'i\'ve': `${user} has`,
    'ive': `${user} has`,
    'i have': `${user} has`,
    'i\'ll': `${user} will`,
    'ill': `${user} will`,
    'i': user,

});

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildWebhooks] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token

function replaceItems(doc, edits, userPronouns) {
    edits.forEach(edit => {
        const split = edit.split(' ')
        if (split.length <= 1) return
        if (split[1].endsWith('s')) return; 
        console.log(split[1])
        // check if 0 is in userPronouns
        if (!userPronouns[split[0]]) {
            return;
        }
        if (/have/g.test(split[1])) {
            return;
        }
        if (/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g.test(split[1][split[1].length-1])) {
            doc.replace(split[1], `${split[1].substring(0, split[1].length - 1)}s${split[1].substring(split[1].length - 1)}`)
            return;
        }
        doc.replace(split[1], `${split[1][split[1].length -1] == 'y' ? split[1].substring(0, split[1].length - 1) + 'ies' : split[1] + 's'}`)
    })
}


function changeToThirdPerson(text, name) {
    const userPronouns = setPronouns(name);
    const doc = nlp(text);
    doc.compute('root')
    const edits = doc.match('#Pronoun').growRight('#Infinitive').out('array')
    replaceItems(doc, edits, userPronouns);
    const edits2 = doc.match('#Pronoun').growLeft('#Infinitive').out('array')
    replaceItems(doc, edits2, userPronouns);
    // check if the before is infintive and if it is, add an 's' to the verb
    Object.keys(userPronouns).forEach(pronoun => {
        doc.replace(pronoun, userPronouns[pronoun]);
    });

    return doc.text();
}

client.on(Events.InteractionCreate, async interaction => {
    // if the user is not in the database and it is not a command, ignore it
    const coll = mongo.db('cursed').collection('users');
    
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);


	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
    console.log('going to execute command')
	try {
        const user = await coll.findOne({id: interaction.user.id});
        console.log(user)
		await command.execute(interaction, user, coll);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

//on message


client.on('messageCreate', async message => {
    const coll = mongo.db('cursed').collection('users');
    const webhooks = mongo.db('cursed').collection('webhooks');
    const user = await coll.findOne({id: message.author.id});
    if (!user) return;
    if (!user.cursed) return;
    if (message.content.startsWith('--')) return; //ooc

    const text = changeToThirdPerson(message.content, user.name);
    // if text is empty, return
    if (!text) return;
    // delete users original message
    message.delete();
    // check if there is a webhook associated with the current channel
    let webhook = await webhooks.findOne({channel: message.channel.id});
    const channel = await client.channels.fetch(message.channel.id);
    try {
    if (!webhook) {
        
        await channel.createWebhook({
            name: 'CurseBot Hook',
            avatar: 'https://cdn.discordapp.com/avatars/90528968160759808/7f1e4e0a5f6b2c7b4b2b3c5b1d6b2e4b.png',
        }).then(async webhook => {
            await webhooks.updateOne({id: message.channel.id}, {$set: {channel: message.channel.id, webhookId: webhook.id, webhookToken: webhook.token}}, {upsert: true});
        });
        webhook = await webhooks.findOne({channel: message.channel.id});

    }
    const webhookArr = await channel.fetchWebhooks();
    const finalWebhook = webhookArr.find(hook => hook.id === webhook.webhookId);
    await finalWebhook.send({
        content: text,
        username: user.name,
        avatarURL: user.avatar,
    });
} catch (e) {
    console.log(e);

} finally{
    return;
}
});


// Connect to MongoDB

    const uri = 'mongodb://localhost:27017';
    const mongo = new MongoClient(uri);
    mongo.connect().then(() => {
        client.login(token);
    });