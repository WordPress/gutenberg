/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ATTACHED_MEDIA } from './dynamic-source';

const variations = [
	{
		name: 'dynamic-gallery',
		title: __( 'Dynamic Gallery' ),
		description: __(
			'Display images from a source, such as those attached to the current post.'
		),
		attributes: {
			dynamicContent: { source: ATTACHED_MEDIA },
		},
		// Match any gallery that has a dynamic source configured, regardless of
		// the specific source or options, so the variation's title and
		// description describe the block whenever it runs in dynamic mode.
		isActive: ( blockAttributes ) => !! blockAttributes.dynamicContent,
		// No scopes for now. While dynamic mode only supports the "attached to the
		// current post" source, `'inserter'` is intentionally omitted: a dedicated
		// inserter entry would surface in post-less contexts (templates, template
		// parts, synced patterns) where there's no post to resolve images from. The
		// entry point is instead the inspector toggle on a regular Gallery.
		// `isActive` still relabels the block card to "Dynamic Gallery" regardless
		// of scope. Revisit adding `'inserter'` in a follow-up as the feature grows
		// beyond the post-attached source.
		scope: [],
	},
];

export default variations;
