import type { EmotionCache } from '@emotion/utils';

declare module '@emotion/react' {
	export function __unsafe_useEmotionCache(): EmotionCache | null;
}
