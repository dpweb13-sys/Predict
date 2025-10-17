const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Express server for uptime robot
const app = express();
app.get('/', (req, res) => res.send('R4BBIT-MINI Bot is running'));
app.listen(process.env.PORT || 3000, () => console.log('Express server running'));

// Load commands dynamically
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = {};
for (const file of commandFiles) {
    commands[file.split('.')[0]] = require(`./commands/${file}`);
}

// /start command
bot.start((ctx) => {
    ctx.replyWithMarkdown(
`*╭══〘〘 𝐑4𝐁𝐁𝐈𝐓-𝐌𝐈𝐍𝐈 〙〙*
*┃❍ Welcome ${ctx.from.first_name}*
*╰═════════════════⊷*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🎵 AUDIO-EDIT', 'audioEdit')],
            [Markup.button.callback('🔄 CONVERTER', 'converter')],
            [Markup.button.callback('🎨 CREATE', 'create')],
            [Markup.button.callback('⬇️ DOWNLOAD', 'download')],
            [Markup.button.callback('🎭 FUN', 'fun')],
            [Markup.button.callback('👥 GROUP', 'group')],
            [Markup.button.callback('⚙️ SYSTEM', 'system')],
        ])
    );
});

// Handle menu callbacks
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    if(commands[data]) {
        commands[data].run(ctx);
    } else {
        ctx.answerCbQuery('Coming soon!');
    }
});

// Group welcome event
bot.on('new_chat_members', (ctx) => {
    const names = ctx.message.new_chat_members.map(u => u.first_name).join(', ');
    ctx.reply(`Welcome to the group, ${names}!`);
});

// Launch bot
bot.launch();
console.log('R4BBIT-MINI Telegram Bot is running...');
