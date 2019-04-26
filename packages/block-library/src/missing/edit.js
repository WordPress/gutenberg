/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

const blockTraverser = ( combiner, initialValue, reducer ) => {
	const recurse = ( block ) => block.innerContent.reduce(
		( [ accumulator, blockIndex ], content ) => (
			null === content ?
				[ combiner( accumulator, reducer( block.innerBlocks[ blockIndex ], recurse ) ), blockIndex + 1 ] :
				[ combiner( accumulator, reducer( content, recurse ) ), blockIndex ]
		),
		[ initialValue, 0 ]
	)[ 0 ];

	return recurse;
};

const blockToHTML = blockTraverser(
	( a, b ) => a + b,
	'',
	( content, recurse ) => 'string' === typeof content ? content : recurse( content )
);

function MissingBlockWarning( { attributes: originalBlock, convertToHTML, convertToBlocks } ) {
	const {
		originalName: blockName,
		originalAttributes: attributes,
		originalInnerBlocks: innerBlocks,
		originalInnerContent: innerContent,
	} = originalBlock;
	const hasContent = !! innerContent.length;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
			blockName
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
			blockName
		);
	}

	return (
		<Fragment>
			<Warning actions={ actions }>
				{ messageHTML }
			</Warning>
			<RawHTML>{ blockToHTML( { name: blockName, attributes, innerContent, innerBlocks } ) }</RawHTML>
		</Fragment>
	);
}

const MissingEdit = withDispatch( ( dispatch, props ) => {
	const { clientId, attributes: {
		originalName: blockName,
		originalAttributes: attributes,
		originalInnerBlocks: innerBlocks,
		originalInnerContent: innerContent,
	} } = props;
	const { replaceBlock, replaceBlocks } = dispatch( 'core/block-editor' );
	return {
		convertToBlocks() {
			const blocks = blockTraverser(
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
			)( { name: blockName, attributes, innerBlocks, innerContent } );

			replaceBlocks( clientId, blocks );
		},
		convertToHTML() {
			replaceBlock( clientId, createBlock( 'core/html', {
				content: blockToHTML( { name: blockName, attributes, innerBlocks, innerContent } ),
			} ) );
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
