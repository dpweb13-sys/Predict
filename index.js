require('dotenv').config(); const { Telegraf, Markup } = require('telegraf'); const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN; const ADMIN_ID = process.env.ADMIN_ID; const DATABASE_URL = process.env.DATABASE_URL;

const bot = new Telegraf(BOT_TOKEN);

// PostgreSQL pool setup const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Helper function to query DB async function query(sql, params) { const client = await pool.connect(); try { const res = await client.query(sql, params); return res; } finally { client.release(); } }

// Create tables if not exist (async () => { await query(CREATE TABLE IF NOT EXISTS users ( user_id BIGINT PRIMARY KEY, username TEXT, uid TEXT, unlocked BOOLEAN DEFAULT FALSE, last_period TEXT );); await query(CREATE TABLE IF NOT EXISTS draws ( id SERIAL PRIMARY KEY, period_number TEXT, prediction TEXT, purchase_amount INT, win_rate FLOAT, extra_info TEXT, created_at TIMESTAMP DEFAULT NOW() );); })();

// Get current period number function getPeriodNumber() { const now = new Date(); const year = now.getUTCFullYear(); const month = String(now.getUTCMonth() + 1).padStart(2, '0'); const day = String(now.getUTCDate()).padStart(2, '0'); const dateStr = ${year}${month}${day};

const hours = now.getUTCHours(); const minutes = now.getUTCMinutes(); const totalMinutes = hours * 60 + minutes;

return dateStr + '1000' + String(10001 + totalMinutes); }

// /start command bot.start(async (ctx) => { const userId = ctx.from.id; const username = ctx.from.username || ctx.from.first_name;

await query( INSERT INTO users(user_id, username) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING, [userId, username] );

ctx.reply(Welcome to R4BBIT WINGO H4CK BOT!\nএখানে তোমাদের WINGO prediction দেওয়া হবে 🎯\n\nBot ব্যবহার করতে প্রথমে এই লিংক থেকে একাউন্ট বানাও: [YOUR_LINK]\nDeposit 200 টাকা করে UID Send করো, Markup.inlineKeyboard([ Markup.button.url('Create Account', 'YOUR_LINK'), Markup.button.callback('Send UID', 'send_uid') ]) ); });

// Capture UID button bot.action('send_uid', (ctx) => { ctx.reply('Please send your UID now:'); ctx.answerCbQuery(); });

// Capture UID text bot.on('text', async (ctx) => { const userId = ctx.from.id; const text = ctx.message.text;

// Check if user is already unlocked or waiting const res = await query(SELECT unlocked FROM users WHERE user_id=$1, [userId]); if(!res.rows.length) return; if(res.rows[0].unlocked) return;

// Save UID temporarily await query(UPDATE users SET uid=$1 WHERE user_id=$2, [text, userId]);

// Notify Admin bot.telegram.sendMessage(ADMIN_ID, User @${ctx.from.username || ctx.from.first_name} sent UID: ${text}, Markup.inlineKeyboard([ Markup.button.callback('Approve ' + userId, approve_${userId}), Markup.button.callback('Cancel ' + userId, cancel_${userId}) ]) );

ctx.reply('✅ Your UID has been sent to admin for approval.'); });

// Admin Approve / Cancel bot.action(/approve_(\d+)/, async (ctx) => { const userId = ctx.match[1]; await query(UPDATE users SET unlocked=TRUE WHERE user_id=$1, [userId]); await ctx.editMessageText('✅ User approved'); bot.telegram.sendMessage(userId, '🎉 Your bot access is approved. You can now get prediction.'); });

bot.action(/cancel_(\d+)/, async (ctx) => { const userId = ctx.match[1]; await query(UPDATE users SET unlocked=FALSE WHERE user_id=$1, [userId]); await ctx.editMessageText('❌ User cancelled'); bot.telegram.sendMessage(userId, '⚠️ Your bot access request was denied. Please check deposit or try again.'); });

// /getprediction command bot.command('getprediction', async (ctx) => { const userId = ctx.from.id; const res = await query(SELECT unlocked, last_period FROM users WHERE user_id=$1, [userId]); if(!res.rows.length) return ctx.reply('You are not registered. Use /start first.'); if(!res.rows[0].unlocked) return ctx.reply('⚠️ You are not authorized. Please send UID and wait for admin approval.');

const currentPeriod = getPeriodNumber(); if(res.rows[0].last_period === currentPeriod) return ctx.reply('⚠️ You have already taken prediction for this period.');

// Generate prediction (example random) const colors = ['Green','Red','Violet']; const prediction = colors[Math.floor(Math.random()*3)]; const winRate = Math.floor(Math.random()*30)+70; // 70-99% const purchaseAmount = 50; const extraInfo = 'Last 5 draws: Green, Red, Green, Violet, Green';

const message = 🎯 WINGO Prediction 🎯\n\nPeriod Number: ${currentPeriod}\nPurchase: ${purchaseAmount} Taka\nWin Rate: ${winRate}%\nPrediction: 🟢 ${prediction}\nExtra Info: ${extraInfo}\nGenerated at: ${new Date().toUTCString()};

await ctx.reply(message); await query(UPDATE users SET last_period=$1 WHERE user_id=$2, [currentPeriod, userId]); await query(INSERT INTO draws(period_number, prediction, purchase_amount, win_rate, extra_info) VALUES($1,$2,$3,$4,$5), [currentPeriod, prediction, purchaseAmount, winRate, extraInfo]); });

bot.launch(); console.log('R4BBIT WINGO BOT is running...');

// Graceful stop process.once('SIGINT', () => bot.stop('SIGINT')); process.once('SIGTERM', () => bot.stop('SIGTERM'));

