import { useEntityProp } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import AccessibleDescription from './accessible-description';

export default function AccessibleMenuDescription( { id } ) {
	const [ menuTitle ] = useEntityProp( 'postType', 'wp_navigation', 'title' );
	const description = sprintf(
		/* translators: %s: Title of a Navigation Menu post. */
		__( `Navigation Menu: "%s"` ),
		menuTitle
	);

	return (
		<AccessibleDescription id={ id }>{ description }</AccessibleDescription>
	);
}
