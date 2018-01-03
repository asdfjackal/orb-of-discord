import db from './dbBase';

const pushSong = (message, song) => {
  db.prepare("INSERT INTO queue (guildID, song, added) VALUES(?,?,datetime('now','localtime'));").run([message.guild.id, song]);
  return;
}

const popSong = (message) => {
  const row = db.prepare("SELECT * FROM queue WHERE guildID = ? ORDER BY added ASC LIMIT 1").get([message.guild.id]);
  if(row === undefined || row instanceof Error){
    return row;
  }
  db.prepare("DELETE FROM queue WHERE id = ?").run([row.id]);
  return row;
}

const clearQueue = (message) => {
  db.prepare("DELETE FROM queue WHERE guildID = ?").run([message.guild.id]);
  return;
}

export {pushSong, popSong, clearQueue};
