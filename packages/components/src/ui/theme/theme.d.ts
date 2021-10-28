import type { Theme as WordPressTheme } from '.';

declare module '@emotion/react' {
	declare interface Theme extends WordPressTheme {}
}
