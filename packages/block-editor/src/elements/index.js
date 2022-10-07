const ELEMENT_CLASS_NAMES = {
	button: 'wp-element-button',
	caption: 'wp-element-caption',
};

export const __experimentalGetElementClassName = ( element ) => {
	return ELEMENT_CLASS_NAMES[ element ] ? ELEMENT_CLASS_NAMES[ element ] : '';
};
