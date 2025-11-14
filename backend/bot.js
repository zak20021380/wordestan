const TelegramBot = require('node-telegram-bot-api');
const BotUser = require('./src/models/BotUser');
require('dotenv').config();

// Bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

// Admin configuration
const ADMIN_ID = '1350508522';

// In-memory state for broadcast feature
const broadcastState = new Map();

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

// Check if user is admin
const isAdmin = (chatId) => {
  return chatId.toString() === ADMIN_ID;
};

// Get bot statistics
const getBotStatistics = async () => {
  try {
    // Total users
    const totalUsers = await BotUser.countDocuments();

    // Active users
    const activeUsers = await BotUser.countDocuments({ isActive: true });

    // Today's new users
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayUsers = await BotUser.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    return {
      totalUsers,
      activeUsers,
      todayUsers
    };
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    throw error;
  }
};

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Save user to database
    await saveUser(msg);

    // Check if admin
    if (isAdmin(chatId)) {
      // Admin panel
      const adminMessage = `
🔐 پنل مدیریت ربات

خوش آمدید! از منوی زیر گزینه مورد نظر را انتخاب کنید:
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
            {
              text: '🎮 بازی',
              web_app: { url: webAppUrl }
            }
          ]
        ]
      };

      await bot.sendMessage(chatId, adminMessage, {
        reply_markup: adminKeyboard
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

// Handle callback queries (inline button clicks)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(query.id);

    // Check if admin
    if (!isAdmin(chatId)) {
      await bot.sendMessage(chatId, '❌ شما دسترسی به این بخش ندارید.');
      return;
    }

    if (data === 'admin_stats') {
      // Show bot statistics
      const stats = await getBotStatistics();

      const statsMessage = `
📊 آمار ربات

👥 تعداد کل کاربران: ${stats.totalUsers}
✅ کاربران فعال: ${stats.activeUsers}
🆕 کاربران امروز: ${stats.todayUsers}
      `;

      await bot.sendMessage(chatId, statsMessage);
      console.log(`📊 Sent statistics to admin`);

    } else if (data === 'admin_broadcast') {
      // Start broadcast flow
      broadcastState.set(chatId, { waitingForMessage: true });

      await bot.sendMessage(chatId, '📢 پیام خود را ارسال کنید:');
      console.log(`📢 Admin entered broadcast mode`);
    }

  } catch (error) {
    console.error('❌ Error handling callback query:', error);
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

    // Check if admin is in broadcast mode
    if (isAdmin(chatId) && broadcastState.has(chatId)) {
      const state = broadcastState.get(chatId);

      if (state.waitingForMessage) {
        // Admin sent the broadcast message
        const broadcastMsg = msg.text || msg.caption || '';

        if (!broadcastMsg) {
          await bot.sendMessage(chatId, '❌ لطفاً یک پیام متنی ارسال کنید.');
          return;
        }

        // Clear broadcast state
        broadcastState.delete(chatId);

        // Send confirmation
        await bot.sendMessage(chatId, '⏳ در حال ارسال پیام...');

        // Broadcast the message
        const result = await broadcastMessage(broadcastMsg);

        // Send result to admin
        const resultMessage = `
✅ پیام به ${result.success} کاربر ارسال شد

📊 آمار ارسال:
• موفق: ${result.success}
• ناموفق: ${result.failed}
• کل: ${result.total}
        `;

        await bot.sendMessage(chatId, resultMessage);
        console.log(`✅ Broadcast completed by admin`);
        return;
      }
    }

    // Regular user message
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
