const { Client, GatewayIntentBits } = require('discord.js');
const { Filter } = require('bad-words');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bannedWords = require('./config/banned-words.json');

// Veritabanı kurulumu
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
const filter = new Filter({ list: CUSTOM_FILTER.list });
filter.addRegex(...CUSTOM_FILTER.regex);

// Veritabanı varsayılan değerleri
db.data ||= { warnings: {} };

client.on('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

// Mesaj kontrolü
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  if(filter.isProfane(message.content)) {
    handleWarning(message);
  }
});

async function handleWarning(message) {
  const userId = message.author.id;
  db.data.warnings[userId] = (db.data.warnings[userId] || 0) + 1;
  await db.write();

  switch(db.data.warnings[userId]) {
    case 1:
      sendFirstWarning(message.author);
      break;
    case 2:
      muteMember(message.member);
      break;
    case 3:
      banUser(message.member);
      break;
  }
  message.delete();
}

// Uyarı Fonksiyonları
async function sendFirstWarning(user) {
  try {
    const dm = await user.createDM();
    await dm.send({
      embeds: [{
        color: 0xFFA500,
        title: "⛔ İlk Uyarı",
        description: "Lütfen sunucu kurallarına uyunuz.\n**Bir sonraki ihlalde susturulacaksınız!**"
      }]
    });
  } catch (error) {
    console.error("DM gönderilemedi:", error);
  }
}

async function muteMember(member) {
  const muteRole = await getOrCreateMuteRole(member.guild);
  
  await member.roles.add(muteRole);
  setTimeout(() => member.roles.remove(muteRole), 24 * 60 * 60 * 1000); // 24 saat
}

async function banUser(member) {
  await member.ban({ reason: '3/3 İhlal Tamamlandı' });
  delete db.data.warnings[member.id];
  await db.write();
}

// Susturma Rolü Yönetimi
async function getOrCreateMuteRole(guild) {
  let role = guild.roles.cache.find(r => r.name === "Susturulmuş");
  
  if (!role) {
    role = await guild.roles.create({
      name: "Susturulmuş",
      color: "#000000",
      permissions: []
    });

    guild.channels.cache.forEach(async channel => {
      await channel.permissionOverwrites.edit(role, {
        SendMessages: false,
        AddReactions: false
      });
    });
  }
  return role;
}

client.login(process.env.token);