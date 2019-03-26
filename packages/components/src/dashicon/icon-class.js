export const getIconClassName = ( icon, className ) => {
	return [ 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
