import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';

const variations = [
	{
		name: 'video',
		title: __( 'Video' ),
		description: __(
			'A video with customizable playback and interaction controls.'
		),
		icon: videoIcon,
		attributes: { controls: true },
		isActive: () => true,
		// Not offered in the inserter; exists so the block always has a named variation.
		scope: [ 'block', 'transform' ],
	},
];

export default variations;
