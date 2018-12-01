export const IconClass = ( props ) => {
	const { icon, className } = props;
	return [ 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
