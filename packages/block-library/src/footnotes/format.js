/**
 * External dependencies
 */
import { v4 as createId } from 'uuid';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatListNumbered as icon } from '@wordpress/icons';
import { insertObject } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	store as blockEditorStore,
	privateApis,
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { createBlock, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { usesContextKey } = unlock( privateApis );

export const formatName = 'core/footnote';

const POST_CONTENT_BLOCK_NAME = 'core/post-content';
const SYNCED_PATTERN_BLOCK_NAME = 'core/block';

export const format = {
	title: __( 'Footnote' ),
	tagName: 'sup',
	className: 'fn',
	attributes: {
		'data-fn': 'data-fn',
	},
	interactive: true,
	contentEditable: false,
	[ usesContextKey ]: [ 'postType', 'postId' ],
	edit: function Edit( {
		value,
		onChange,
		isObjectActive,
		context: { postType, postId },
	} ) {
		const registry = useRegistry();
		const {
			getSelectedBlockClientId,
			getBlocks,
			getBlockRootClientId,
			getBlockName,
			getBlockParentsByBlockName,
		} = registry.select( blockEditorStore );
		const isFootnotesSupported = useSelect(
			( select ) => {
				if (
					! select( blocksStore ).getBlockType( 'core/footnotes' )
				) {
					return false;
				}

				const allowedBlocks =
					select( blockEditorStore ).getSettings().allowedBlockTypes;
				if (
					allowedBlocks === false ||
					( Array.isArray( allowedBlocks ) &&
						! allowedBlocks.includes( 'core/footnotes' ) )
				) {
					return false;
				}

				const entityRecord = select( coreDataStore ).getEntityRecord(
					'postType',
					postType,
					postId
				);

				if ( 'string' !== typeof entityRecord?.meta?.footnotes ) {
					return false;
				}

				// Checks if the selected block lives within a pattern.
				const {
					getBlockParentsByBlockName: _getBlockParentsByBlockName,
					getSelectedBlockClientId: _getSelectedBlockClientId,
				} = select( blockEditorStore );
				const parentCoreBlocks = _getBlockParentsByBlockName(
					_getSelectedBlockClientId(),
					SYNCED_PATTERN_BLOCK_NAME
				);
				return ! parentCoreBlocks || parentCoreBlocks.length === 0;
			},
			[ postType, postId ]
		);

		const { selectionChange, insertBlock } =
			useDispatch( blockEditorStore );

		if ( ! isFootnotesSupported ) {
			return null;
		}

		function onClick() {
			registry.batch( () => {
				let id;
				if ( isObjectActive ) {
					const object = value.replacements[ value.start ];
					id = object?.attributes?.[ 'data-fn' ];
				} else {
					id = createId();
					const newValue = insertObject(
						value,
						{
							type: formatName,
							attributes: {
								'data-fn': id,
							},
							innerHTML: `<a href="#${ id }" id="${ id }-link">*</a>`,
						},
						value.end,
						value.end
					);
					newValue.start = newValue.end - 1;
					onChange( newValue );
				}

				const selectedClientId = getSelectedBlockClientId();

				/*
				 * Attempts to find a common parent post content block.
				 * This allows for locating blocks within a page edited in the site editor.
				 */
				const parentPostContent = getBlockParentsByBlockName(
					selectedClientId,
					POST_CONTENT_BLOCK_NAME
				);

				// When called with a post content block, getBlocks will return
				// the block with controlled inner blocks included.
				const blocks = parentPostContent.length
					? getBlocks( parentPostContent[ 0 ] )
					: getBlocks();

				// BFS search to find the first footnote block.
				let fnBlock = null;
				{
					const queue = [ ...blocks ];
					while ( queue.length ) {
						const block = queue.shift();
						if ( block.name === 'core/footnotes' ) {
							fnBlock = block;
							break;
						}
						queue.push( ...block.innerBlocks );
					}
				}

				// Maybe this should all also be moved to the entity provider.
				// When there is no footnotes block in the post, create one and
				// insert it at the bottom.
				if ( ! fnBlock ) {
					let rootClientId = getBlockRootClientId( selectedClientId );

					while (
						rootClientId &&
						getBlockName( rootClientId ) !== POST_CONTENT_BLOCK_NAME
					) {
						rootClientId = getBlockRootClientId( rootClientId );
					}

					fnBlock = createBlock( 'core/footnotes' );

					insertBlock( fnBlock, undefined, rootClientId );
				}

				selectionChange( fnBlock.clientId, id, 0, 0 );
			} );
		}

		return (
			<RichTextToolbarButton
				icon={ icon }
				title={ __( 'Footnote' ) }
				onClick={ onClick }
				isActive={ isObjectActive }
			/>
		);
	},
};
