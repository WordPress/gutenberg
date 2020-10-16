/**
 * @typedef OwnProps
 *
 * @property {string} icon        Icon name
 * @property {number} [size=20]   Icon size
 * @property {string} [className] Class name
 */
/** @typedef {import('react').ComponentPropsWithoutRef<'span'> & OwnProps} Props */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
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
			// Ignore reason: span attributes are the global attributes which do not include width/height
			// See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
			// See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
			// PR to remove: https://github.com/WordPress/gutenberg/pull/26067
			// @ts-ignore
			width={ size }
			height={ size }
			{ ...extraProps }
		/>
	);
}

export default Dashicon;
