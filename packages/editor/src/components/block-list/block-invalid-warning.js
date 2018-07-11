/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import {
	getBlockType,
	createBlock,
	rawHandler,
} from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';

function BlockInvalidWarning( { convertToHTML, convertToBlocks, convertToClassic } ) {
	const hasHTMLBlock = !! getBlockType( 'core/html' );

	return (
		<Warning
			primaryActions={ [
				<Button key="convert" onClick={ convertToBlocks } isLarge isPrimary={ ! hasHTMLBlock }>
					{ __( 'Convert to Blocks' ) }
				</Button>,
				hasHTMLBlock && (
					<Button key="edit" onClick={ convertToHTML } isLarge isPrimary>
						{ __( 'Keep as HTML' ) }
					</Button>
				),
			] }
			hiddenActions={ [
				{ title: __( 'Convert to Blocks' ), onClick: convertToBlocks },
				{ title: __( 'Convert to Classic Block' ), onClick: convertToClassic },
			] }
		>
			{ __( 'This block has been modified externally.' ) }
		</Warning>
	);
}

export default withDispatch( ( dispatch, { block } ) => {
	const { replaceBlock } = dispatch( 'core/editor' );
	return {
		convertToClassic() {
			replaceBlock( block.uid, createBlock( 'core/freeform', {
				content: block.originalContent,
			} ) );
		},
		convertToHTML() {
			replaceBlock( block.clientId, createBlock( 'core/html', {
				content: block.originalContent,
			} ) );
		},
		convertToBlocks() {
			replaceBlock( block.clientId, rawHandler( {
				HTML: block.originalContent,
				mode: 'BLOCKS',
			} ) );
		},
	};
} )( BlockInvalidWarning );
