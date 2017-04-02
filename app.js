import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import ImageSearch from './imageSearch.js';

const bot = new Discord.Client();

const streamOptions = { seek: 0, volume: 1 };

bot.on("message", msg => {
    if (msg.author.bot) return;

    if (!msg.content.startsWith("!")) return;

    if (msg.content.startsWith("!echo")) {
      msg.channel.sendMessage(msg.content.slice(5).trim())
    }

    if (msg.content.startsWith("!i")) {
      ImageSearch(bot, msg, msg.content.slice(3).split(' '));
    }

    var userIsDJ = false;
    const members = msg.guild.roles.find('name',"DJ").members;
    members.forEach(member => {
      if (member.user.id === msg.author.id) {
        userIsDJ = true;
      }
    });

    if (userIsDJ){
      var sender = msg.guild.members.get(msg.author.id);
      if(sender) return;

      var channel = sender.voiceChannel();
      if(channel) return;

      if (msg.content.startsWith("!stop")) {
        channel.connection.disconnect();
        msg.delete();
      }

      if (msg.content.startsWith("!play")) {
        channel.join().then(connection => {
          const stream = ytdl(url, {filter : 'audioonly', quality: 'lowest'});
          const dispatcher = connection.playStream(stream, streamOptions);
          dispatcher.on("end", reason => {
            bot.voiceConnections.array().forEach( connection => {
              connection.disconnect();
            });
          });
        }).catch(console.error);
        msg.delete();
      }
    }

});

bot.on('ready', () => {
  console.log('Up and running...');
});

bot.login(process.env.BOT_TOKEN);
