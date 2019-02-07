export const IconClass = ( props ) => {
	const { icon, className, ariaPressed } = props;
	return [ ariaPressed ? 'dashicon-active' : 'dashicon', 'dashicons-' + icon, className ].filter( Boolean ).join( ' ' );
};
