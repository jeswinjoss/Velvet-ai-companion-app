import { CharacterProfile, Message, UserProfile } from './types';

const PROFILES_KEY = 'velvet_ai_profiles';
const USER_PROFILE_KEY = 'velvet_user_profile';
const CHAT_PREFIX = 'velvet_ai_chat_';

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getAllProfiles = (): CharacterProfile[] => {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (!data) return [];
    const profiles = JSON.parse(data) as CharacterProfile[];
    return profiles.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) { return []; }
};

export const saveProfile = (profile: CharacterProfile) => {
  try {
    const profiles = getAllProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) { profiles[index] = profile; } else { profiles.unshift(profile); }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {}
};

export const deleteProfile = (id: string) => {
  try {
    const profiles = getAllProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));
    localStorage.removeItem(`${CHAT_PREFIX}${id}`);
  } catch (e) {}
};

export const getUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(USER_PROFILE_KEY);
    if (data) return JSON.parse(data);
    return { name: 'User', avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4`, interests: [] };
  } catch (e) { return { name: 'User', avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4`, interests: [] }; }
};

export const saveUserProfile = (profile: UserProfile) => {
  try { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
};

export const saveChatHistory = (profileId: string, messages: Message[]) => {
  try {
    const HISTORY_LIMIT = 50;
    const truncated = messages.slice(-HISTORY_LIMIT);
    localStorage.setItem(`${CHAT_PREFIX}${profileId}`, JSON.stringify(truncated));
  } catch (e) {}
};

export const getChatHistory = (profileId: string): Message[] => {
  try {
    const data = localStorage.getItem(`${CHAT_PREFIX}${profileId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const checkAndMigrate = () => {
   const oldSession = localStorage.getItem('velvet_ai_session');
   if (oldSession) {
       try {
           const parsed = JSON.parse(oldSession);
           if (parsed.profile) {
               const newProfile = { ...parsed.profile, id: generateId(), createdAt: Date.now() };
               saveProfile(newProfile);
               if (parsed.messages) saveChatHistory(newProfile.id, parsed.messages);
           }
           localStorage.removeItem('velvet_ai_session');
       } catch(e) { localStorage.removeItem('velvet_ai_session'); }
   }
}
