/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { blockTraverser, createBlock, getBlockType } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

const blockToHTML = blockTraverser(
	( a, b ) => a + b,
	'',
	( content, recurse ) => 'string' === typeof content ? content : recurse( content )
);

function MissingBlockWarning( { attributes: { parsedBlock }, convertToHTML, convertToBlocks } ) {
	const { name, attributes, innerBlocks, innerContent } = parsedBlock;
	const hasContent = !! innerContent.length;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
			name
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
			name
		);
	}

	return (
		<Fragment>
			<Warning actions={ actions }>
				{ messageHTML }
			</Warning>
			<RawHTML>{ blockToHTML( { name, attributes, innerContent, innerBlocks } ) }</RawHTML>
		</Fragment>
	);
}

const MissingEdit = withDispatch( ( dispatch, props ) => {
	const { clientId, attributes: { parsedBlock } } = props;
	const { replaceBlock, replaceBlocks } = dispatch( 'core/block-editor' );

	return {
		convertToBlocks() {
			replaceBlocks( clientId, blockTraverser(
				( a, b ) => a.concat( b ),
				[],
				( content, recurse ) => {
					// splice in nested inner content
					if ( Array.isArray( content ) ) {
						return recurse( content );
					}

					// pass-through regular block objects
					if ( 'string' !== typeof content ) {
						return content;
					}

					// skip "empty" blocks which came from the
					// whitespace between blocks
					if ( ! content.blockName && ! content.trim().length ) {
						return [];
					}

					// append other text as a raw HTML block
					return createBlock( 'core/html', { content } );
				}
			)( parsedBlock ) );
		},
		convertToHTML() {
			replaceBlock( clientId, createBlock( 'core/html', {
				content: blockToHTML( parsedBlock ),
			} ) );
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
