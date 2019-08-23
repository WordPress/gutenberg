/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
export default function save( { attributes } ) {
	const { site, url } = attributes;

	if ( ! url ) {
		return null;
	}

	// TODO: suggestions for fall back icon?
	const classes = classNames( 'wp-social-icon' );
	return (
		<li className={ classes }>
			<a href={ url }>{ site }</a>
		</li>
	);
}
