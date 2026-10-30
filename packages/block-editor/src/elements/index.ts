const ELEMENT_CLASS_NAMES: Record< string, string > = {
	button: 'wp-element-button',
	caption: 'wp-element-caption',
};

export const __experimentalGetElementClassName = ( element: string ) => {
	return ELEMENT_CLASS_NAMES[ element ] ? ELEMENT_CLASS_NAMES[ element ] : '';
};
