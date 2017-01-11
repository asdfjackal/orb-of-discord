var Discord = require("discord.js");
var ytdl = require("ytdl-core");
var bot = new Discord.Client();

const streamOptions = { seek: 0, volume: 1 };

bot.on("message", msg => {
    if (msg.author.bot) return;

    if (!msg.content.startsWith("!")) return;

    if (msg.content.startsWith("!echo")) {
      msg.channel.sendMessage(msg.content.slice(5).trim())
    }

    userIsDJ = false;
    members = msg.guild.roles.find('name',"DJ").members;
    members.forEach(member => {
      if (member.user.id === msg.author.id) {
        userIsDJ = true;
      }
    });

    if (userIsDJ){
      if (msg.content.startsWith("!stop")) {
        bot.voiceConnections.array().forEach( connection => {
          connection.disconnect();
        });
        msg.delete();
      }

      if (msg.content.startsWith("!play")) {
        var url = msg.content.slice(5).trim();

        var voiceChannel = null;

        for (var channel of msg.channel.guild.channels.array()) {
    			// If the channel is a voice channel, ...
          console.log(channel.type);
    			if (channel.type === 'voice') {
            console.log(channel.type);
            channel.join().then(connection => {
              const stream = ytdl(url, {filter : 'audioonly', quality: 'lowest'});
              const dispatcher = connection.playStream(stream, streamOptions);
              dispatcher.on("end", reason => {
                bot.voiceConnections.array().forEach( connection => {
                  connection.disconnect();
                });
              });
            }).catch(console.error);

    				break;
    			}
    		}
        msg.delete();
      }
    }

});

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.login(process.env.BOT_TOKEN);
