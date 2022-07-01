/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function createTemplatePartPostData(
	area,
	blocks = [],
	title = __( 'Untitled Template Part' )
) {
	// Currently template parts only allow latin chars.
	// Fallback slug will receive suffix by default.
	const cleanSlug = kebabCase( title ).replace( /[^\w-]+/g, '' );

	// If we have `area` set from block attributes, means an exposed
	// block variation was inserted. So add this prop to the template
	// part entity on creation. Afterwards remove `area` value from
	// block attributes.
	return {
		title,
		slug: cleanSlug,
		content: serialize( blocks ),
		// `area` is filterable on the server and defaults to `UNCATEGORIZED`
		// if provided value is not allowed.
		area,
	};
}
