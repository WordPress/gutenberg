export const IconClass = ( icon, className ) => {
	return [ 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
