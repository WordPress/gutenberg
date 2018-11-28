export const IconClass = ( props ) => {
	const { icon, className, ariaPressed, style } = props;

	// 🙈 style-to-classname-to-style 🙃
	if ( style !== undefined ) {
		return style;
	}

	return [ ariaPressed ? 'dashicon-active' : 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
