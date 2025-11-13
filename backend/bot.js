const TelegramBot = require('node-telegram-bot-api');
const BotUser = require('./src/models/BotUser');
require('dotenv').config();

// Bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot started...');

// Store or update user in database
const saveUser = async (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const { first_name, last_name, username } = msg.from;

    let user = await BotUser.findOne({ chatId });

    if (user) {
      // Update existing user
      user.firstName = first_name || user.firstName;
      user.lastName = last_name || user.lastName;
      user.username = username || user.username;
      user.isActive = true;
      await user.updateLastInteraction();
      console.log(`✅ Updated user: ${chatId}`);
    } else {
      // Create new user
      user = new BotUser({
        chatId,
        firstName: first_name,
        lastName: last_name,
        username
      });
      await user.save();
      console.log(`✨ New user added: ${chatId}`);
    }

    return user;
  } catch (error) {
    console.error('❌ Error saving user:', error);
    throw error;
  }
};

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Save user to database
    await saveUser(msg);

    // Welcome message in Persian
    const welcomeMessage = `
🎮 سلام! به بازی کلمات خوش آمدید

این بازی چالش برانگیز کلمه‌سازی است که در آن باید از حروف موجود، کلمات مختلف بسازید!

🌟 ویژگی‌های بازی:
• صدها مرحله جذاب
• سیستم سکه و جایزه
• رقابت در جدول امتیازات
• سیستم یادگیری لایتنر

برای شروع بازی روی دکمه زیر کلیک کنید 👇
    `;

    // Create inline keyboard with web app button
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎮 شروع بازی',
            web_app: { url: webAppUrl }
          }
        ]
      ]
    };

    // Send message with button
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });

    console.log(`📨 Sent welcome message to: ${chatId}`);
  } catch (error) {
    console.error('❌ Error handling /start command:', error);
    await bot.sendMessage(chatId, '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  }
});

// Handle any other messages
bot.on('message', async (msg) => {
  // Skip if it's a command (already handled)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;

  try {
    // Update user's last interaction
    await saveUser(msg);

    // Send a friendly response
    const response = `
برای شروع بازی از دستور /start استفاده کنید.
    `;

    await bot.sendMessage(chatId, response);
  } catch (error) {
    console.error('❌ Error handling message:', error);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.code);
  console.error('Message:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Broadcast function
const broadcastMessage = async (message, options = {}) => {
  try {
    // Get all active users
    const users = await BotUser.find({ isActive: true });

    console.log(`📢 Broadcasting message to ${users.length} users...`);

    let successCount = 0;
    let failureCount = 0;

    // Send message to each user
    for (const user of users) {
      try {
        await bot.sendMessage(user.chatId, message, options);
        successCount++;

        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Failed to send to ${user.chatId}:`, error.message);

        // If user blocked the bot, mark as inactive
        if (error.response && error.response.statusCode === 403) {
          user.isActive = false;
          await user.save();
        }

        failureCount++;
      }
    }

    const result = {
      total: users.length,
      success: successCount,
      failed: failureCount
    };

    console.log(`✅ Broadcast complete:`, result);
    return result;
  } catch (error) {
    console.error('❌ Error in broadcast:', error);
    throw error;
  }
};

// Export bot and broadcast function
module.exports = {
  bot,
  broadcastMessage
};
