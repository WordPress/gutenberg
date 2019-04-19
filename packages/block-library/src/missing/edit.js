/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

function MissingBlockWarning( { attributes, convertToHTML, convertToBlocks } ) {
	const { originalName, originalInnerContent } = attributes;
	const hasContent = !! originalInnerContent.length;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
			originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLarge isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
		actions.push(
			<Button key="convert_to_blocks" onClick={ convertToBlocks } isLarge isPrimary>
				{ __( 'Extract contents as blocks' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.' ),
			originalName
		);
	}

	return (
		<Fragment>
			<Warning actions={ actions }>
				{ messageHTML }
			</Warning>
			<RawHTML>{ originalInnerContent.join( '' ) }</RawHTML>
		</Fragment>
	);
}

const MissingEdit = withDispatch( ( dispatch, props ) => {
	const { clientId, attributes: { originalInnerBlocks: innerBlocks, originalInnerContent: innerContent } } = props;
	const { replaceBlock, replaceBlocks } = dispatch( 'core/block-editor' );
	return {
		convertToBlocks() {
			const blocks = [];
			let blockIndex = 0;

			for ( const content of innerContent ) {
				// just an inner block
				if ( null === content ) {
					blocks.push( innerBlocks[ blockIndex++ ] );
					continue;
				}

				// skip whitespace-only freeform HTML content
				// it usually comes in between blocks
				if ( ! content.blockName && ! content.trim().length ) {
					continue;
				}

				blocks.push( createBlock( 'core/html', { content } ) );
			}

			replaceBlocks( clientId, blocks );
		},
		convertToHTML() {
			replaceBlock( clientId, createBlock( 'core/html', {
				content: innerContent.join( '' ),
			} ) );
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
