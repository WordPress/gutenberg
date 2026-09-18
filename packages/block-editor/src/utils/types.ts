/**
 * Result of formatting a font style or weight.
 */
export interface FormattedFont {
	/** Human readable name. */
	name?: string;
	/** Original CSS value. */
	value?: string;
}

/**
 * A font family face from theme.json.
 */
export interface FontFamilyFace {
	fontStyle?: string;
	fontWeight?: string | number;
}

/**
 * Combined font style and weight option for a font picker.
 */
export interface CombinedStyleAndWeightOption {
	key: string;
	name: string;
	style: {
		fontStyle?: string;
		fontWeight?: string;
	};
}
