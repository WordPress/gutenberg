import type { EmotionCache } from '@emotion/utils';
import type { WordPressTheme } from './theme';

declare module '@emotion/react' {
	export function __unsafe_useEmotionCache(): EmotionCache | null;
	declare interface Theme extends WordPressTheme {}
}
