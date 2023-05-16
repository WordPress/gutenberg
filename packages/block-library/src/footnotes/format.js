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

export const format = {
	title: __( 'Footnote' ),
	tagName: 'a',
	className: 'fn',
	contentEditable: false,
	edit: function Edit( { value, onChange, isActive } ) {
		const registry = useRegistry();
		const { getBlocks } = useSelect( blockEditorStore );
		const { selectionChange } = useDispatch( blockEditorStore );
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
						'data-fn': id,
					},
				} );

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
				const fnBlock = flattenBlocks( getBlocks() ).find(
					( block ) => block.name === 'core/footnotes'
				);
				selectionChange( fnBlock.clientId, id, 0, 0 );
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
