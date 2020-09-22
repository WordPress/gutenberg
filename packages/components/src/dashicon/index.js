function Dashicon( { icon, size = 20, className, ...extraProps } ) {
	const iconClass = [
		'dashicon',
		'dashicons',
		'dashicons-' + icon,
		className,
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<span
			className={ iconClass }
			width={ size }
			height={ size }
			{ ...extraProps }
		/>
	);
}

export default Dashicon;
