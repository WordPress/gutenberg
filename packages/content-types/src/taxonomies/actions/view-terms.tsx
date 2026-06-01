/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { TaxonomyFormData } from '../types';

const viewTermsAction: Action< TaxonomyFormData > = {
	id: 'view-terms',
	label: __( 'View terms' ),
	// Drafts aren't registered, and `edit-tags.php` requires a `post_type`
	// query arg to render the term list, so the taxonomy must also be
	// attached to at least one post type.
	isEligible: ( item ) =>
		item.status === 'publish' &&
		Array.isArray( item.config.object_type ) &&
		item.config.object_type.length > 0,
	callback: ( items, { onActionPerformed } ) => {
		const item = items[ 0 ];
		const postType = item?.config.object_type?.[ 0 ];
		if ( ! item?.slug || ! postType ) {
			return;
		}
		document.location.href = addQueryArgs( 'edit-tags.php', {
			taxonomy: item.slug,
			post_type: postType,
		} );
		onActionPerformed?.( items );
	},
};

export default viewTermsAction;
