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
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name } from './block.json';

export const formatName = 'core/footnote';
export const format = {
	title: __( 'Footnote' ),
	tagName: 'a',
	className: 'fn',
	attributes: {
		id: 'id',
		href: 'href',
		'data-fn': 'data-fn',
	},
	contentEditable: false,
	edit: function Edit( { value, onChange, isObjectActive } ) {
		const registry = useRegistry();
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockName,
			getBlocks,
		} = useSelect( blockEditorStore );
		const { selectionChange, insertBlock } =
			useDispatch( blockEditorStore );
		function onClick() {
			registry.batch( () => {
				const id = createId();
				const newValue = insertObject(
					value,
					{
						type: formatName,
						attributes: {
							href: '#' + id,
							id: `${ id }-link`,
							'data-fn': id,
						},
						innerHTML: '*',
					},
					value.end,
					value.end
				);
				newValue.start = newValue.end - 1;

				onChange( newValue );

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
