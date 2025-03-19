const { Client, GatewayIntentBits } = require('discord.js');
const { Filter } = require('bad-words');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const express = require('express'); // Yeni eklenen kısım
const bannedWords = require('./config/banned-words.json');

// Keep Alive Sistemi
const server = express();
server.all('/', (req, res) => {
  res.send('🤖 Bot Aktif!');
});

function keepAlive() {
  server.listen(process.env.PORT || 3000, () => {
    console.log(`Keep-Alive port ${process.env.PORT || 3000}'de başlatıldı`);
  });
}

// Veritabanı ve Discord İşlemleri
const adapter = new JSONFile('warnings.json');
const db = new Low(adapter);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bad-words filtresi
const filter = new Filter({ list: bannedWords.kufurler });
filter.addRegex(...bannedWords.regexler);

// Veritabanı varsayılan değerleri
db.data ||= { warnings: {} };

client.on('ready', () => {
  console.log(`${client.user.tag} aktif!`);
  
  // Bot aktivite ayarı
  client.user.setActivity({
    name: `${client.guilds.cache.size} sunucuyu koruyor`,
    type: 3 // WATCHING
  });
  
  keepAlive(); // Keep alive başlatma
});

// ... (Diğer fonksiyonlar aynı kalacak) ...

client.login(process.env.TOKEN);
