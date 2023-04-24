/**
 * External dependencies
 */
import { v4 as createId } from 'uuid';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';
import { insert, applyFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createBlock } from '@wordpress/blocks';

export const format = {
	title: __( 'Footnote' ),
	tagName: 'a',
	className: 'fn',
	edit: function Edit( { value, onChange, isActive } ) {
		const registry = useRegistry();
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockName,
			getBlocks,
		} = useSelect( blockEditorStore );
		const { insertBlock, selectBlock, updateBlockAttributes } =
			useDispatch( blockEditorStore );
		function onClick() {
			registry.batch( () => {
				const id = createId();
				let newValue = insert( value, '*' );
				newValue.start = newValue.end - 1;
				newValue = applyFormat( newValue, {
					type: 'core/footnote',
					attributes: {
						href: '#' + id,
						id: `${ id }-link`,
						contenteditable: 'false',
					},
				} );

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

				updateBlockAttributes( fnBlock.clientId, {
					footnotes: [
						...fnBlock.attributes.footnotes,
						{
							id,
							content: '',
						},
					],
				} );

				onChange( newValue );
				selectBlock( fnBlock.clientId, -1 );
			} );
		}

		return (
			<RichTextToolbarButton
				icon={ icon }
				title={ __( 'Footnote' ) }
				onClick={ onClick }
				isActive={ isActive }
			/>
		);
	},
};
