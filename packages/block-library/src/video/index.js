/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video as icon } from '@wordpress/icons';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

// Register Tip.
const { __experimentalRegisterBlockTip } = dispatch( 'core/block-editor' );
__experimentalRegisterBlockTip(
	name,
	__(
		'The video block accepts uploads in the MP4, M4V, WebM, OGV, WMV, and FLV formats.'
	)
);

export { metadata, name };

export const settings = {
	title: __( 'Video' ),
	description: __(
		'Embed a video from your media library or upload a new one.'
	),
	icon,
	keywords: [ __( 'movie' ) ],
	transforms,
	supports: {
		align: true,
		lightBlockWrapper: true,
	},
	edit,
	save,
};
