/**
 * WordPress dependencies
 */
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';

export interface CollectionFontFace {
	id: string;
	font_face_settings: FontFace;
}

export interface FontFace {
	fontFamily: string;
	fontStyle?: string;
	fontWeight?: string | number;
	src?: string | string[];
	preview?: string;
	file?: File | File[];
	fake?: boolean;
	id?: string;
	fontDisplay?: string;
	fontStretch?: string;
	fontVariant?: string;
	fontFeatureSettings?: string;
	fontVariationSettings?: string;
	unicodeRange?: string;
}

export interface CollectionFontFamily {
	id: string;
	font_family_settings: FontFamily;
	categories?: string[];
	_embedded?: {
		font_faces?: CollectionFontFace[];
	};
}

export interface FontFamily {
	name: string;
	slug: string;
	fontFamily: string;
	fontFace?: FontFace[];
	preview?: string;
	id?: string;
	source?: string;
	version?: string;
	author?: string;
	license?: string;
	description?: string;
	tags?: string[];
	variants?: FontFace[];
	category?: string;
}

export interface FontCollection {
	id: string;
	slug: string;
	name: string;
	description?: string;
	font_families?: CollectionFontFamily[];
	categories?: {
		slug: string;
		name: string;
	}[];
}

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
	collections: FontCollection[];
	getFontCollection: ( slug: string ) => Promise< FontCollection | void >;
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
