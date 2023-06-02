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

export const format = {
	title: __( 'Footnote' ),
	tagName: 'a',
	className: 'fn',
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
				const newValue = insertObject( value, {
					type: 'core/footnote',
					attributes: {
						href: '#' + id,
						id: `${ id }-link`,
						'data-fn': id,
					},
					innerHTML: '*',
				} );
				newValue.start = newValue.end - 1;

				onChange( newValue );

				const flattenBlocks = ( blocks ) =>
					blocks.reduce(
						( acc, block ) => [
							...acc,
							block,
							...flattenBlocks( block.innerBlocks ),
						],
						[]
					);
				let fnBlock = flattenBlocks( getBlocks() ).find(
					( block ) => block.name === 'core/footnotes'
				);

				// Maybe this should all also be moved to the entity provider.
				if ( ! fnBlock ) {
					const clientId = getSelectedBlockClientId();
					let rootClientId = getBlockRootClientId( clientId );

					while (
						rootClientId &&
						getBlockName( rootClientId ) !== 'core/post-content'
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
