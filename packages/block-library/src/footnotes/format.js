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
import { createBlock, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name } from './block.json';
import { unlock } from '../lock-unlock';

const { usesContextKey } = unlock( privateApis );

export const formatName = 'core/footnote';
export const format = {
	title: __( 'Footnote' ),
	tagName: 'sup',
	className: 'fn',
	attributes: {
		'data-fn': 'data-fn',
	},
	contentEditable: false,
	[ usesContextKey ]: [ 'postType' ],
	edit: function Edit( {
		value,
		onChange,
		isObjectActive,
		context: { postType },
	} ) {
		const registry = useRegistry();
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockName,
			getBlocks,
		} = useSelect( blockEditorStore );
		const footnotesBlockType = useSelect( ( select ) =>
			select( blocksStore ).getBlockType( name )
		);
		const { selectionChange, insertBlock } =
			useDispatch( blockEditorStore );

		if ( ! footnotesBlockType ) {
			return null;
		}

		if ( postType !== 'post' && postType !== 'page' ) {
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

				// BFS search to find the first footnote block.
				let fnBlock = null;
				{
					const queue = [ ...getBlocks() ];
					while ( queue.length ) {
						const block = queue.shift();
						if ( block.name === name ) {
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
					const clientId = getSelectedBlockClientId();
					let rootClientId = getBlockRootClientId( clientId );

					while (
						rootClientId &&
						getBlockName( rootClientId ) !== 'core/post-content'
					) {
						rootClientId = getBlockRootClientId( rootClientId );
					}

					fnBlock = createBlock( name );

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
