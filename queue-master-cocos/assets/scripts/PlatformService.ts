declare const wx: any;
declare const tt: any;

interface MiniGameApi {
    showShareMenu?: (options?: Record<string, unknown>) => void;
    onShareAppMessage?: (callback: () => Record<string, unknown>) => void;
    shareAppMessage?: (options: Record<string, unknown>) => void;
    vibrateShort?: (options?: Record<string, unknown>) => void;
    getLaunchOptionsSync?: () => { query?: Record<string, string> };
}

export type RuntimePlatform = 'wechat' | 'douyin' | 'web';

export class PlatformService {
    private readonly api: MiniGameApi | null;
    public readonly platform: RuntimePlatform;

    public constructor() {
        if (typeof wx !== 'undefined') {
            this.platform = 'wechat';
            this.api = wx as MiniGameApi;
        } else if (typeof tt !== 'undefined') {
            this.platform = 'douyin';
            this.api = tt as MiniGameApi;
        } else {
            this.platform = 'web';
            this.api = null;
        }
    }

    public initializeShareMenu(): void {
        this.api?.showShareMenu?.({ withShareTicket: true });
        this.api?.onShareAppMessage?.(() => ({
            title: '这批打工人该怎么排？来挑战我的判断',
            query: 'from=share',
        }));
    }

    public vibrate(success = true): void {
        this.api?.vibrateShort?.({ type: success ? 'light' : 'heavy' });
    }

    public shareChallenge(seed: number, score: number): void {
        const query = `mode=challenge&seed=${seed}&score=${score}`;
        if (this.api?.shareAppMessage) {
            this.api.shareAppMessage({
                title: `我在排队大师拿了 ${score} 分，你能超过吗？`,
                query,
            });
            return;
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            const url = `${location.origin}${location.pathname}?${query}`;
            void navigator.clipboard.writeText(url);
        }
    }

    public getChallenge(): { seed: number; score: number } | null {
        let query: Record<string, string> = {};
        if (this.api?.getLaunchOptionsSync) {
            query = this.api.getLaunchOptionsSync().query ?? {};
        } else if (typeof location !== 'undefined') {
            query = Object.fromEntries(new URLSearchParams(location.search).entries());
        }

        const seed = Number(query.seed);
        const score = Number(query.score);
        return query.mode === 'challenge' && seed > 0 && score > 0 ? { seed, score } : null;
    }
}
