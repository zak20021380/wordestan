const TelegramBot = require('node-telegram-bot-api');
const BotUser = require('./src/models/BotUser');
require('dotenv').config();

// Bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

// Admin user ID
const ADMIN_ID = 1350508522;

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// Store admin's broadcast state in memory
const broadcastState = new Map();

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
  const userId = msg.from.id;

  try {
    // Save user to database
    await saveUser(msg);

    // Check if user is admin
    if (userId === ADMIN_ID) {
      // Admin panel
      const adminMessage = `
🔐 پنل مدیریت

سلام مدیر عزیز! به پنل مدیریت ربات خوش آمدید.
      `;

      const adminKeyboard = {
        inline_keyboard: [
          [
            { text: '📊 آمار ربات', callback_data: 'admin_stats' }
          ],
          [
            { text: '📢 ارسال پیام همگانی', callback_data: 'admin_broadcast' }
          ],
          [
            { text: '🎮 بازی', web_app: { url: webAppUrl } }
          ]
        ]
      };

      await bot.sendMessage(chatId, adminMessage, {
        reply_markup: adminKeyboard,
        parse_mode: 'HTML'
      });

      console.log(`📨 Sent admin panel to: ${chatId}`);
    } else {
      // Regular user welcome message
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
    }
  } catch (error) {
    console.error('❌ Error handling /start command:', error);
    await bot.sendMessage(chatId, '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  // Only admin can use these callbacks
  if (userId !== ADMIN_ID) {
    await bot.answerCallbackQuery(query.id, {
      text: '⛔ شما مجاز به استفاده از این بخش نیستید',
      show_alert: true
    });
    return;
  }

  try {
    // Handle admin stats
    if (data === 'admin_stats') {
      await bot.answerCallbackQuery(query.id);

      // Get statistics
      const totalUsers = await BotUser.countDocuments();
      const activeUsers = await BotUser.countDocuments({ isActive: true });

      // Get today's new users
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayUsers = await BotUser.countDocuments({
        createdAt: { $gte: startOfToday }
      });

      const statsMessage = `
📊 آمار ربات

👥 تعداد کل کاربران: ${totalUsers}
✅ کاربران فعال: ${activeUsers}
🆕 کاربران امروز: ${todayUsers}

📅 تاریخ: ${new Date().toLocaleDateString('fa-IR')}
      `;

      await bot.sendMessage(chatId, statsMessage);
      console.log(`📊 Sent stats to admin: ${chatId}`);
    }

    // Handle broadcast request
    else if (data === 'admin_broadcast') {
      await bot.answerCallbackQuery(query.id);

      // Set broadcast state
      broadcastState.set(chatId, { waitingForMessage: true });

      const broadcastPrompt = `
📢 ارسال پیام همگانی

پیام خود را ارسال کنید:

⚠️ این پیام به همه کاربران فعال ارسال خواهد شد.
      `;

      await bot.sendMessage(chatId, broadcastPrompt);
      console.log(`📢 Admin requested broadcast: ${chatId}`);
    }
  } catch (error) {
    console.error('❌ Error handling callback query:', error);
    await bot.answerCallbackQuery(query.id, {
      text: '❌ خطایی رخ داد',
      show_alert: true
    });
  }
});

// Handle any other messages
bot.on('message', async (msg) => {
  // Skip if it's a command (already handled)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Check if admin is in broadcast mode
    if (userId === ADMIN_ID && broadcastState.has(chatId)) {
      const state = broadcastState.get(chatId);

      if (state.waitingForMessage) {
        // Clear broadcast state
        broadcastState.delete(chatId);

        // Send confirmation message
        await bot.sendMessage(chatId, '⏳ در حال ارسال پیام به کاربران...');

        // Broadcast the message
        const result = await broadcastMessage(msg.text);

        // Send result
        const resultMessage = `
✅ پیام به ${result.success} کاربر ارسال شد

📊 نتیجه ارسال:
• موفق: ${result.success}
• ناموفق: ${result.failed}
• مجموع: ${result.total}
        `;

        await bot.sendMessage(chatId, resultMessage);
        console.log(`✅ Broadcast completed by admin: ${chatId}`);
        return;
      }
    }

    // Regular user handling
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
