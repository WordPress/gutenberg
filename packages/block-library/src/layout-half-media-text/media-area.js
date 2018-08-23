/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks, BlockPlaceholder } from '@wordpress/editor';
import { withSelect } from '@wordpress/data';

export const name = 'core/half-media-media-area';
const ALLOWED_BLOCKS = [
	'core/image',
	'core/video',
	'core-embed/flickr',
	'core-embed/youtube',
	'core-embed/vimeo',
	'core-embed/videopress',
];

export const settings = {
	attributes: {},

	title: __( 'Media Area' ),

	parent: [ 'core/half-media' ],

	icon: 'format-image',

	category: 'common',

	supports: {
		hoverMarks: false,
		selectionMarks: false,
		settingsMenu: false,
		inserter: false,
	},

	edit: withSelect( ( select, { clientId } ) => {
		const { getBlockOrder } = select( 'core/editor' );
		const blocksInside = getBlockOrder( clientId );
		return {
			hasInnerBlocks: blocksInside && blocksInside.length > 0,
		};
	} )(
		( { clientId, hasInnerBlocks } ) => {
			return (
				<InnerBlocks
					className="half-media__media"
					allowedBlocks={ hasInnerBlocks ? [] : ALLOWED_BLOCKS }
					templateLock={ false }
					showWhenEmpty={ (
						<BlockPlaceholder
							rootClientId={ clientId }
						/>
					) }
				/>
			);
		}
	),

	save() {
		return <div className="half-media__media"><InnerBlocks.Content /></div>;
	},
};
