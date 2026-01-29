/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AccessibleDescription from './accessible-description';

export default function AccessibleMenuDescription( { id } ) {
	const [ menuTitle ] = useEntityProp( 'postType', 'wp_navigation', 'title' );
	/* translators: %s: Title of a Navigation Menu post. */
	const description = sprintf( __( `Navigation Menu: "%s"` ), menuTitle );

	return (
		<AccessibleDescription id={ id }>{ description }</AccessibleDescription>
	);
}
