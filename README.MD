<p align="center">
  <img src="https://media.giphy.com/media/14msSL3Osb4FCo/giphy.gif" height="250" width="500">
</p>

[![Discord](https://img.shields.io/discord/710205261196820684?color=fa860a&logo=discord&logoColor=white)](https://discord.com/invite/GHrauVmzj9)
[![npm version](https://img.shields.io/npm/v/shunko?style=flat-square)](https://www.npmjs.com/package/shunko)
[![npm download](https://img.shields.io/npm/dt/shunko.svg?maxAge=3600)](https://www.npmjs.com/package/shunko)
![GitHub issues](https://img.shields.io/github/issues-raw/SilentKiller345/shunko?style=flat-square)

  
# 🎶 Shunko

A Simple but powerful Lavalink Client for your JavaScript Discord Bot!

# 🔨 Requirements 

* Node.js >= 16.9.0 or Latest.
* Discord.js >= 14.6.0.

# 📖 Documentation
- [Shoukaku Docs](https://deivu.github.io/Shoukaku).

# 📦 How to Install Shunko
```js
Stable: "npm i npm i shunko"
```

# How to Setup our Shunko

## Set the Initilizer of Shunko

*Creating in a way like the code example you can import the bot, nodes and shoukakuOptions.*

```js
const { Client, GatewayIntentBits } = require("discord.js");
const { Shunko } = require("shunko");
const { Connectors } = require("shoukaku");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
});


client.shunko = new Shunko({
    nodes: [{
      name: "Lavalink",
      url: "localhost:2333",
      auth: "youshallpass",
      secure: false
    }],
    shoukakuoptions: {
        moveOnDisconnect: false,
        resumable: false,
        resumableTimeout: 60,
        reconnectTries: 10,
        restTimeout: 60000
    },
    spotify: [{
        ClientID: "Your spotify clientId here",
        ClientSecret: "Your spotify clientSecret here"
    }],
    defaultSearchEngine: "ShunkoSpotify",
}, new Connectors.DiscordJS(client));

client.login("token");
```

## A small example to create play command.
```js
module.exports = {
   name: "play",
   aliases: ["p"],
   run: async (client, message, args) => {
   
const player = await client.shunko.createPlayer({
    guildId: message.guild.id,
    voiceId: message.member.voice.channel.id,
    textId: message.channel.id,
    shardId: message.guild.shardId,
    volume: 100,
    deaf: true,
});

const resolve = await player.search(args.join(" "));
const { loadType, tracks, playlistInfo } = resolve;

if (loadType === "NO_MATCHES" || !tracks.length) return message.reply({content: "No match songs result found!"});

if (loadType === "PLAYLIST_LOADED") {
    for (const track of tracks) {
        player.queue.add(track, { requester: message.author });
    }
    if (!player.playing && !player.paused) await player.play();
    message.channel.send({ content: `Added ${player.queue.length} tracks from ${playlistInfo.name}` });
} else if (loadType === "SEARCH_RESULT" || loadType === "TRACK_LOADED") {
    player.queue.add(tracks[0], { requester: message.author });
    if (!player.playing && !player.paused) await player.play();
    message.channel.send({ content: `Queued ${tracks[0].info.title}` });
} else return;
  }
}
```

# Getting the Events (shoukaku)

> *You can access event with the help of `client.shunko.shoukaku.on()....`.*

<center>

| **Event Name** 	|   **Elements**  	  |       **Description**         |
|:--------------:	|:------------------: |:----------------------------: |
|   ready 	      | name, resumed       | Event of the node connection. |
|   error         | name, error 	      | Event of the node error.      |
|   close         | name, code, reason  | Event of the node close.	    |
|   disconnect    | name, players, move | Event of the node disconnect.	|
|   debug         | name, reason	      | Event of the node debug.      |
</center>

# Getting the Events (Shunko)

> *You can access event with the help of `client.shunko.on()....`.*

<center>

| **Event Name** 	  |   **Elements**  |       **Description**         |
|:----------------: |:--------------: |:----------------------------: |
|   trackStart	    | player, track   | Event of the track start.     |
|   trackEnd        | player, track	  | Event of the track end.       |
|   queueEnd        | player          | Event of the queue end.	      |
|   PlayerClosed    | player, data    | Event of the player close.	  |
|   trackException  | player, data	  | Event of the track exception. |
|   PlayerUpdate    | player, data	  | Event of the player update.   |
|   trackStuck      | player, data	  | Event of the track stuck.     |
|   trackError      | player, error   | Event of the track error.     |
|   PlayerResumed   | player          | Event of the player resumed.  |
|   PlayerDestroy   | player	        | Event of the player destroyed.|
|   PlayerCreate    | player	        | Event of the player create.   |
</center>

## Donations 🧡🧡
> You can donate to us to improve our project!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/ichigokurosaki)

## Contributors
> Deivu as the owner of [Shoukaku](https://github.com/Deivu/Shoukaku).
>
> [Matrix](https://discord.com/users/889897813356466237) as a helper for this package.
>
> [Ichigo Kurosaki](https://discord.com/users/780474989195296781) as owner of this package.