/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';
import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	__experimentalLabel( attributes, { clientId, context } ) {
		// Only show the label in list view.
		if ( context !== 'list-view' ) {
			return;
		}

		// Check if the block is inside a Query Loop block.
		const queryLoopBlockIds = select(
			blockEditorStore
		).getBlockParentsByBlockName( clientId, 'core/query' );

		const blockTitle = __( 'Search' );
		const customName = attributes?.metadata?.name;

		// If the block is not inside a Query Loop block, return the block label.
		if ( ! queryLoopBlockIds.length ) {
			return customName || blockTitle;
		}

		const queryLoopBlock = select( blockEditorStore ).getBlock(
			queryLoopBlockIds[ 0 ]
		);

		// Check if the Query Loop block has enhanced pagination enabled and
		// if the `__experimentalEnableSearchQueryBlock` flag is enabled.
		const hasInstantSearch = !! (
			queryLoopBlock?.attributes?.enhancedPagination &&
			window?.__experimentalEnableSearchQueryBlock
		);

		if ( ! hasInstantSearch ) {
			return customName || blockTitle;
		}

		return sprintf(
			/* translators: %s: The block label */
			__( '%s (Instant search enabled)' ),
			customName || blockTitle
		);
	},
	example: {
		attributes: { buttonText: __( 'Search' ), label: __( 'Search' ) },
		viewportWidth: 400,
	},
	variations,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
