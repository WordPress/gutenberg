import { __ } from '@wordpress/i18n';
import { gallery, grid } from '@wordpress/icons';
import { ATTACHED_MEDIA } from './dynamic-source';
import { isGalleryFlexLayout } from './shared';

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
	{
		name: 'gallery-flex',
		title: __( 'Gallery' ),
		description: __( 'Arrange images in flexible rows.' ),
		icon: gallery,
		attributes: {
			layout: {
				type: 'flex',
			},
		},
		isActive: ( blockAttributes ) =>
			isGalleryFlexLayout( blockAttributes.layout ),
		scope: [ 'transform' ],
	},
	{
		name: 'gallery-grid',
		title: __( 'Gallery Grid' ),
		description: __( 'Arrange images in a grid.' ),
		icon: grid,
		attributes: {
			layout: {
				type: 'grid',
			},
		},
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'grid',
		scope: [ 'transform' ],
	},
];

export default variations;
