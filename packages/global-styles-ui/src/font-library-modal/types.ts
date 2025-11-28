/**
 * WordPress dependencies
 */
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';
import type { FontFamily, FontFace } from '@wordpress/core-data';

export type FontFaceToUpload = FontFace & {
	file?: File | File[];
};

export type FontFamilyToUpload = Omit< FontFamily, 'fontFace' > & {
	fontFace?: FontFaceToUpload[];
};

export interface FontLibraryState {
	isInstalling: boolean;
	fontFamilies: Record< string, FontFamilyPreset[] >;
	notice?: {
		type: 'success' | 'error' | 'info';
		message: string;
	};
	loadFontFaceAsset: ( fontFace: FontFace ) => Promise< void >;
	installFonts: ( fonts: FontFamily[] ) => Promise< void >;
	uninstallFontFamily: ( fontFamily: FontFamily ) => Promise< {
		deleted: boolean;
	} >;
	refreshLibrary: () => void;
	// Additional properties found in the codebase
	baseCustomFonts: FontFamily[];
	modalTabOpen: string;
	setModalTabOpen: ( tab: string ) => void;
	handleSetLibraryFontSelected: ( font?: FontFamily ) => void;
	libraryFontSelected?: FontFamily;
	isFontActivated: (
		slug: string,
		style?: string,
		weight?: string | number,
		source?: string
	) => boolean;
	getFontFacesActivated: ( slug: string, source?: string ) => string[];
	toggleActivateFont: ( font: FontFamily, face?: FontFace ) => void;
	getAvailableFontsOutline: (
		availableFontFamilies: FontFamily[]
	) => Record< string, string[] >;
	saveFontFamilies: (
		fonts:
			| FontFamilyPreset[]
			| Record< string, FontFamilyPreset[] >
			| undefined
	) => Promise< void >;
	isResolvingLibrary: boolean;
}

export interface FontDemoProps {
	font: FontFamily | FontFace;
	text?: string;
	onClick?: () => void;
}

export interface FontCardProps {
	font: FontFamily;
	onClick?: () => void;
	variantsText?: string;
}

export interface FontVariantProps {
	fontFace: FontFace;
	fontFamily: FontFamily;
	isSelected?: boolean;
	onClick?: () => void;
}

export interface CollectionFontVariantProps {
	face: FontFace;
	font: FontFamily;
	handleToggleVariant: ( font: FontFamily, face?: FontFace ) => void;
	selected: boolean;
}

export interface FontUploadResult {
	successes: FontFace[];
	errors: Array< {
		data: FormData;
		message: string;
	} >;
}

export interface GoogleFontsAPIResponse {
	items: Array< {
		family: string;
		variants: string[];
		subsets: string[];
		version: string;
		lastModified: string;
		files: Record< string, string >;
		category: string;
		kind: string;
		menu: string;
	} >;
}

export type FontWeight =
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';
export type FontStyle = 'normal' | 'italic';
export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
export type FontStretch =
	| 'normal'
	| 'ultra-condensed'
	| 'extra-condensed'
	| 'condensed'
	| 'semi-condensed'
	| 'semi-expanded'
	| 'expanded'
	| 'extra-expanded'
	| 'ultra-expanded';
