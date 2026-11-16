/**
 * Props of `ContrastChecker` and the arguments of `getContrastWarning`.
 */
export interface ContrastCheckerProps {
	/**
	 * Background color.
	 */
	backgroundColor?: string;
	/**
	 * Fallback background color.
	 */
	fallbackBackgroundColor?: string;
	/**
	 * Fallback text color.
	 */
	fallbackTextColor?: string;
	/**
	 * Fallback link color.
	 */
	fallbackLinkColor?: string;
	/**
	 * Font size value in pixels.
	 */
	fontSize?: number;
	/**
	 * Whether the text is large.
	 */
	isLargeText?: boolean;
	/**
	 * Text color.
	 */
	textColor?: string;
	/**
	 * Link color.
	 */
	linkColor?: string;
	/**
	 * Caller-provided copy used in place of the generic guidance.
	 */
	messageOverride?: string;
	/**
	 * Whether to warn about transparent text.
	 */
	enableAlphaChecker?: boolean;
}

/**
 * A contrast warning, with the message to show and the one to announce.
 */
export interface ContrastWarning {
	message: string;
	speakMessage: string;
}
