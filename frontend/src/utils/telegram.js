const isBrowser = typeof window !== 'undefined';

export const isTelegramWebApp = () => {
  if (!isBrowser) {
    return false;
  }

  const webApp = window.Telegram?.WebApp;
  return Boolean(webApp && typeof webApp.initData === 'string' && webApp.initData.length > 0);
};

export const getTelegramUser = () => {
  if (!isTelegramWebApp()) {
    return null;
  }

  const webApp = window.Telegram.WebApp;

  return {
    initData: webApp.initData,
    user: webApp.initDataUnsafe?.user || null,
    authDate: webApp.initDataUnsafe?.auth_date || null,
  };
};

export const initializeTelegramWebApp = () => {
  if (!isTelegramWebApp()) {
    return;
  }

  try {
    const webApp = window.Telegram.WebApp;
    if (typeof webApp.ready === 'function') {
      webApp.ready();
    }
    if (typeof webApp.expand === 'function') {
      webApp.expand();
    }
  } catch (error) {
    console.warn('Failed to initialize Telegram Web App SDK:', error);
  }
};
