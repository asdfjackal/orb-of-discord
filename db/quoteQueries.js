import db from './dbBase';

const findQuote = (message, trigger) => {
  const row = db.prepare("SELECT * FROM quotes WHERE trigger = ? AND guildID = ?").get([trigger, message.guild.id]);
  return row;
}

const listQuotes = (message) => {
  const rows = db.prepare("SELECT * FROM quotes WHERE guildID = ?").all([message.guild.id]);
  return rows;
}

const createQuote = (message, trigger, quote) => {
  const row = findQuote(message, trigger);
  if(!(row instanceof Error) && row === undefined){
    const insert = db.prepare("INSERT INTO quotes (guildID, trigger, quote) VALUES(?,?,?)").run([message.guild.id, trigger, quote]);
    return true;
  }else if(row !== undefined){
    return false;
  }else{
    return row;
  }
}

const deleteQuote = (message, trigger) => {
  db.prepare("DELETE FROM quotes WHERE trigger = ? and guildID = ?").run([trigger, message.guild.id]);
}

export {findQuote, listQuotes, createQuote, deleteQuote};
