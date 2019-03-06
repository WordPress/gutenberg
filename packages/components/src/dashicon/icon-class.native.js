export const IconClass = ( icon, className, ariaPressed ) => {
	return [ ariaPressed ? 'dashicon-active' : 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
 