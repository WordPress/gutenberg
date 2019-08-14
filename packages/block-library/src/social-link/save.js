/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */

export default function save( { attributes, className } ) {
	const { icon, url } = attributes;
	const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );

	return (
		<span className={ className }>
			<a href={ url }><span className={ classes }></span></a>
		</span>
	);
}
