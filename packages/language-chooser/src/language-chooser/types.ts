export type Locale = string;

export interface Language {
	locale: Locale;
	nativeName: string;
	lang: string;
	installed: boolean;
}
