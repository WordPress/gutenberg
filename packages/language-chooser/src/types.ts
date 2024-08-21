export type Locale = string;

export interface Language {
	locale: Locale;
	nativeName: string;
	lang: string;
	installed: boolean;
}

export interface PreferredLanguagesConfig {
	currentLocale: Locale;
	preferredLanguages: Language[];
	allLanguages: Language[];
	hasMissingTranslations: boolean;
	showOptionSiteDefault: boolean;
}
