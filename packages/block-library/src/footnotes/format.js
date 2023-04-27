/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject } from '@wordpress/rich-text';
import {
	RichText,
	RichTextToolbarButton,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Fill } from './slot-fill';

const name = 'core/footnote';
const title = __( 'Footnote' );

export const format = {
	name,
	title,
	tagName: 'data',
	attributes: {
		note: ( element ) =>
			element.innerHTML.replace( /^\[/, '' ).replace( /\]$/, '' ),
	},
	render( { attributes: { note }, setAttributes } ) {
		return (
			<sup>
				<a className="note-link" href="#placeholder">
					{ '' }
				</a>
				<Fill>
					<li>
						<RichText
							value={ note }
							onChange={ ( value ) =>
								setAttributes( { note: value } )
							}
						/>
					</li>
				</Fill>
			</sup>
		);
	},
	saveFallback( { attributes: { note } } ) {
		return `[${ note }]`;
	},
	edit: function Edit( { isObjectActive, value, onChange } ) {
		const registry = useRegistry();
		const {
			getSelectedBlockClientId,
			getBlockRootClientId,
			getBlockName,
			getBlocks,
		} = useSelect( blockEditorStore );
		const { insertBlock, selectBlock } = useDispatch( blockEditorStore );

		function onClick() {
			registry.batch( () => {
				const newValue = insertObject( value, {
					type: name,
					attributes: {
						note: '',
					},
				} );
				newValue.start = newValue.end - 1;

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

				onChange( newValue );
				selectBlock( fnBlock.clientId, -1 );
			} );
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
			</>
		);
	},
};
