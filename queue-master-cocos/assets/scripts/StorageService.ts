import { sys } from 'cc';
import { DEFAULT_PROFILE, todayKey } from './GameData';
import { PlayerProfile } from './GameTypes';

const PROFILE_KEY = 'queue-master-profile-v2';

export class StorageService {
    public loadProfile(): PlayerProfile {
        try {
            const raw = sys.localStorage.getItem(PROFILE_KEY);
            const saved = raw ? JSON.parse(raw) as Partial<PlayerProfile> : {};
            const profile: PlayerProfile = {
                ...DEFAULT_PROFILE,
                ...saved,
                stars: saved.stars ?? {},
                bestScores: saved.bestScores ?? {},
                collection: saved.collection ?? [],
                daily: saved.daily ?? {},
            };

            if (profile.ticketDay !== todayKey()) {
                profile.tickets = 5;
                profile.ticketDay = todayKey();
            }
            return profile;
        } catch {
            return {
                ...DEFAULT_PROFILE,
                stars: {},
                bestScores: {},
                collection: [],
                daily: {},
            };
        }
    }

    public saveProfile(profile: PlayerProfile): void {
        sys.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
}
