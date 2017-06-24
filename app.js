import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import YouTubeSearch from 'youtube-search';
import ImageSearch from './imageSearch.js';

const bot = new Discord.Client();

const streamOptions = { seek: 0, volume: 1 };

const opts = {
  maxResults: 1,
  key: process.env.GOOGLE_API_KEY,
}

bot.on("message", msg => {
    if (msg.author.bot) return;

    if (!msg.content.startsWith("!")) return;

    if (msg.content.startsWith("!echo")) {
      msg.reply(msg.content.slice(5).trim())
      return;
    }

    if (msg.content.startsWith("!i")) {
      ImageSearch(bot, msg, msg.content.slice(3).split(' '));
      return;
    }

    if (msg.content.startsWith("!yt")) {
      YouTubeSearch(msg.content.slice(3), opts, (err, results) => {
        if (err){
          msg.reply("There was an error when searching for videos");
        }else{
          msg.reply(results[0].link);
        }
      })
    }

    var userIsDJ = false;
    const members = msg.guild.roles.find('name',"DJ").members;
    members.forEach(member => {
      if (member.user.id === msg.author.id) {
        userIsDJ = true;
      }
    });

    if (userIsDJ && (msg.content.startsWith("!stop") || msg.content.startsWith("!play"))){
      var sender = msg.guild.members.get(msg.author.id);
      if(!sender) return;

      var channel = sender.voiceChannel;
      if(!channel){
        msg.reply("must be in a voice channel to run that command.");
        msg.delete();
        return;
      }

      if (msg.content.startsWith("!stop")) {
        if(!channel.connection) return ;
        channel.connection.disconnect();
        msg.delete();
      }

      if (msg.content.startsWith("!play")) {
        var url = msg.content.slice(5).trim();

        bot.voiceConnections.array().forEach( connection => {
          if(connection.channel.guild.id === msg.guild.id && connection.channel.id !== channel.id){
            connection.disconnect();
          }
        });

        channel.join().then(connection => {
          const stream = ytdl(url, {filter : 'audioonly', quality: 'lowest'});
          const dispatcher = connection.playStream(stream, streamOptions);
          msg.reply(" playing " + url + " in " + channel.name);
          dispatcher.on("end", reason => {
            if(reason === "Stream is not generating quickly enough."){
              connection.disconnect();
            }
          });
        }).catch(error => {
          console.log(error);
        });
        msg.delete();
      }
    }

});

bot.on('ready', () => {
  console.log('Up and running...');
});

bot.login(process.env.BOT_TOKEN);
