/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * @typedef OwnProps
 *
 * @property {string} icon        Icon name
 * @property {string} [className] Class name
 */
/** @typedef {import('react').ComponentPropsWithoutRef<'span'> & OwnProps} Props */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
function Dashicon( { icon, className, ...extraProps } ) {
	deprecated( '`Dashicon component`', {
		alternative:
			'`Icon component` from `@wordpress/icon` package along with `@wordpress/icons` SVG icons or custom SVG icons',
	} );

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
