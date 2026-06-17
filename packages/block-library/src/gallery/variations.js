/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'dynamic-gallery',
		title: __( 'Dynamic Gallery' ),
		description: __(
			'Display images from a source, such as those attached to the current post.'
		),
		attributes: {
			dynamicContent: { source: 'core/attached-media' },
		},
		// Match any gallery that has a dynamic source configured, regardless of
		// the specific source or options, so the variation's title and
		// description describe the block whenever it runs in dynamic mode.
		isActive: ( blockAttributes ) => !! blockAttributes.dynamicContent,
		// `inserter` only: the variation appears as its own inserter entry, but
		// is deliberately omitted from `transform` so the block toolbar's
		// "Transform to variation" switcher isn't exposed (the inspector toggle
		// is the intended way to switch modes). `isActive` still drives the
		// block card's title/description regardless of scope.
		scope: [ 'inserter' ],
	},
];

export default variations;
