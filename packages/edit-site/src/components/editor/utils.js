/* Supporting data */
export const GLOBAL_CONTEXT = 'global';
export const PRESET_CATEGORIES = {
	color: { path: [ 'color', 'palette' ], key: 'color' },
	gradient: { path: [ 'color', 'gradients' ], key: 'gradient' },
	fontSize: { path: [ 'typography', 'fontSizes' ], key: 'size' },
};
export const PRESET_CLASSES = {
	color: { ...PRESET_CATEGORIES.color, property: 'color' },
	'background-color': {
		...PRESET_CATEGORIES.color,
		property: 'background-color',
	},
	'gradient-background': {
		...PRESET_CATEGORIES.gradient,
		property: 'background',
	},
	'font-size': {
		...PRESET_CATEGORIES.fontSize,
		property: 'font-size',
	},
};
export const LINK_COLOR = '--wp--style--color--link';
export const LINK_COLOR_DECLARATION = `a { color: var(${ LINK_COLOR }, #00e); }`;

/* Helpers for unit processing */
export const fromPx = ( value ) => {
	switch ( typeof value ) {
		case 'string':
			return +value.replace( 'px', '' );
		case 'number':
		default:
			return value;
	}
};

export const toPx = ( value ) => ( value ? value + 'px' : value );
