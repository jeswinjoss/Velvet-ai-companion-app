
const USAGE_KEY = 'velvet_api_usage';

interface UsageData {
  timestamps: number[]; // List of request timestamps for RPM calculation
  dailyCount: number;
  lastDate: string; // YYYY-MM-DD
  cooldownUntil: number; // Timestamp when 429 lockout ends
}

const LIMITS = {
  RPM: 15, // Requests per minute (Gemini Flash Free)
  RPD: 1500 // Requests per day
};

const getUsageData = (): UsageData => {
  try {
    const str = localStorage.getItem(USAGE_KEY);
    if (!str) return { timestamps: [], dailyCount: 0, lastDate: new Date().toDateString(), cooldownUntil: 0 };
    const data = JSON.parse(str);
    
    // Reset daily count if new day
    if (data.lastDate !== new Date().toDateString()) {
        data.dailyCount = 0;
        data.lastDate = new Date().toDateString();
    }
    return data;
  } catch {
    return { timestamps: [], dailyCount: 0, lastDate: new Date().toDateString(), cooldownUntil: 0 };
  }
};

const saveUsageData = (data: UsageData) => {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
};

export const usageService = {
  trackRequest: () => {
    const data = getUsageData();
    const now = Date.now();
    
    // Prune timestamps older than 1 minute
    data.timestamps = data.timestamps.filter(t => now - t < 60000);
    
    // Add new request
    data.timestamps.push(now);
    data.dailyCount += 1;
    
    saveUsageData(data);
  },

  triggerCooldown: (seconds: number = 60) => {
    const data = getUsageData();
    data.cooldownUntil = Date.now() + (seconds * 1000);
    saveUsageData(data);
  },

  getStats: () => {
    const data = getUsageData();
    const now = Date.now();
    
    // Calculate active RPM
    const activeRequests = data.timestamps.filter(t => now - t < 60000).length;
    
    // Check cooldown
    const cooldownRemaining = Math.max(0, Math.ceil((data.cooldownUntil - now) / 1000));

    return {
      rpm: activeRequests,
      rpmLimit: LIMITS.RPM,
      rpd: data.dailyCount,
      rpdLimit: LIMITS.RPD,
      cooldownRemaining,
      isRateLimited: activeRequests >= LIMITS.RPM || cooldownRemaining > 0
    };
  }
};
