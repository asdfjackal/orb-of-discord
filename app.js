import Discord from 'discord.js';
import ytdl from 'ytdl-core-discord';
import YouTubeSearch from 'youtube-search';
import ImageSearch from './imageSearch.js';
import { findQuote, listQuotes, createQuote, deleteQuote } from './db/quoteQueries.js';
import { pushSong, popSong, clearQueue } from './db/queueQueries.js';

const bot = new Discord.Client();


bot.login(process.env.BOT_TOKEN);

bot.on('debug', console.log)

const streamOptions = { seek: 0, volume: 1 };

const opts = {
  maxResults: 1,
  key: process.env.GOOGLE_API_KEY,
}

bot.on("message", msg => {
    if (msg.author.bot) return;

    if (msg.guild === null) return;

    if (!msg.content.startsWith("!")) return;

    if (msg.content.startsWith("!echo ")) {
      msg.reply(msg.content.slice(5).trim())
      return;
    }

    if (msg.content.startsWith("!help")) {
      const helpString = `General Commands:
        !i <search term> <optional result number>
        !yt <search term>
        !q <trigger>
        !listquotes

        Users With Quote Permissions:
        !addquote <trigger>  <quote> (Note the two spaces)
        !removequote <trigger>

        Users with DJ Permissions:
        !play <youtube link>
        !stop
        !queue <youtube link>
        !next
        !clear`;
      msg.author.send(helpString.split("\n").map(line => line.trim()).join("\n"));
      msg.delete();
      return;
    }

    if (msg.content.startsWith("!i ")) {
      ImageSearch(bot, msg, msg.content.slice(3).split(' '));
      return;
    }

    if (msg.content.startsWith("!yt ")) {
      YouTubeSearch(msg.content.slice(3), opts, (err, results) => {
        if (err){
          msg.reply("There was an error when searching for videos");
        }else{
          msg.reply(results[0].link);
        }
      })
      return;
    }

    if (msg.content.startsWith("!q ")) {
      const quote = findQuote(msg, msg.content.slice(3).trim());
      if(quote instanceof Error){
        console.log(Error);
        msg.channel.send("Something is wrong, contact your admin.");
        msg.delete();
        return;
      }else if(quote === undefined){
        msg.reply("No quote with that trigger exists on this server.");
        msg.delete();
        return;
      }else{
        msg.reply(quote.quote);
        msg.delete();
        return;
      }
    }

    if (msg.content.startsWith("!listquotes")) {
      const quotes = listQuotes(msg);
      if(quotes instanceof Error){
        console.log(Error);
        msg.author.send("Something is wrong, contact your admin.");
        msg.delete();
        return;
      }else if(quotes === undefined){
        msg.author.send("No quotes exist on this server.");
        msg.delete();
        return;
      }else{
        msg.author.send(quotes.map(row => (row.trigger + " - " + row.quote)));
        msg.delete();
        return;
      }
    }

    var userIsQuotes = false;
    const quoteRole = msg.guild.roles.find(x => x === "addquotes");
    if(quoteRole !== null){
      quoteRole.members.forEach(member => {
        if (member.user.id === msg.author.id) {
          userIsQuotes = true;
        }
      });
    }

    if (userIsQuotes && msg.content.startsWith("!addquote ")) {
      const params = msg.content.slice(10).trim().split("  ");
      if(params.length !== 2){
        msg.channel.sendMessage("Incorrect Syntax. !addquote <trigger>  <quote>");
        return;
      }
      const trigger = params[0].trim();
      const quote = params[1].trim();

      const newQuote = createQuote(msg, trigger, quote);
      if(newQuote instanceof Error){
        console.log(Error);
        msg.channel.send("Something is wrong, contact your admin.")
        msg.delete();
        return;
      }else if(!newQuote){
        msg.reply("A quote with that trigger already exists on this server.");
        msg.delete();
        return;
      }else{
        msg.reply("Quote Created");
        msg.delete();
        return;
      }
      return;quote.quote
    }

    if (userIsQuotes && msg.content.startsWith("!removequote ")) {
      const trigger = msg.content.slice(13).trim();
      deleteQuote(msg, trigger);
      msg.reply("Quote Deleted");
      msg.delete();
      return;
    }

    if (!userIsQuotes && (msg.content.startsWith("!addquote ") || msg.content.startsWith("!removequote "))){
      msg.reply("You can't do that here... and you know it.");
      msg.delete();
    }

    var userIsDJ = false;
    const djRole = msg.guild.roles.find(x => x.name === "DJ");
    if (djRole !== null){
      djRole.members.forEach(member => {
        if (member.user.id === msg.author.id) {
          userIsDJ = true;
        }
      });
    }

    if (userIsDJ && (msg.content.startsWith("!stop") || msg.content.startsWith("!play ") || msg.content.startsWith("!queue ") || msg.content.startsWith("!next") || msg.content.startsWith("!clear"))){
      var sender = msg.guild.members.get(msg.author.id);
      if (!sender) return;

      var channel = sender.voiceChannel;
      if (!channel){
        msg.reply("must be in a voice channel to run that command.");
        msg.delete();
        return;
      }

      const playSong = (url) => {
        // bot.voiceConnections.array().forEach( connection => {
        //   if(connection.channel.guild.id === msg.guild.id && connection.channel.id !== channel.id){
        //     connection.disconnect();
        //   }
        // });

        channel.leave();

        channel.join().then(async (connection) => {
          // console.log(info)
          const stream = await ytdl(url)
          const dispatcher = await connection.playStream(stream);
          msg.channel.send("Playing " + url + " in " + channel.name);
          dispatcher.on("debug", message => {
            console.log(message);
          });
          dispatcher.on("end", reason => {
            // console.log(reason)
            playNextSong();
          });
          dispatcher.on('error', console.error);
        }).catch(error => {
          console.log(error);
          return;
        });
        return;
      }

      const playNextSong = () => {
        const song = popSong(msg);
        console.log(song);
        if(song !== undefined && !(song instanceof Error)){
          playSong(song.song);
        }else{
          if(!channel.connection) return;
          channel.connection.disconnect();
        }
        return;
      }

      if (msg.content.startsWith("!stop")) {
        if(!channel.connection) return;
        channel.connection.disconnect();
        msg.delete();
        return;
      }

      if (msg.content.startsWith("!play ")) {
        var url = msg.content.slice(5).trim();
        playSong(url);
        msg.delete();
        return;
      }

      if (msg.content.startsWith("!queue ")) {
        var url = msg.content.slice(6).trim();
        pushSong(msg, url);
        msg.reply("Added song to queue.");
        msg.delete();
        return;
      }

      if (msg.content.startsWith("!next")) {
        playNextSong();
        msg.delete();
        return;
      }

      if (msg.content.startsWith("!clear")) {
        clearQueue(msg);
        msg.reply("Clearing queue.");
        msg.delete();
        return;
      }
    }

    if (!userIsDJ && (msg.content.startsWith("!stop") || msg.content.startsWith("!play ") || msg.content.startsWith("!queue ") || msg.content.startsWith("!next") || msg.content.startsWith("!clear"))){
      msg.reply("You can't do that here... and you know it.");
      msg.delete();
      return;
    }
});

bot.on('ready', () => {
  console.log('Up and running...');
});

