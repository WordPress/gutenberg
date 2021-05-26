/**
 * @typedef OwnProps
 *
 * @property {import('./types').IconKey} icon Icon name
 * @property {string} [className] Class name
 */
/** @typedef {import('react').ComponentPropsWithoutRef<'span'> & OwnProps} Props */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
function Dashicon( { icon, className, ...extraProps } ) {
	const iconClass = [
		'dashicon',
		'dashicons',
		'dashicons-' + icon,
		className,
	]
		.filter( Boolean )
		.join( ' ' );

	return <span className={ iconClass } { ...extraProps } />;
}

export default Dashicon;
