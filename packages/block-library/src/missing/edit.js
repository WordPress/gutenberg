/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock, parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

function MissingBlockWarning( { attributes, convertToHTML, extractBlocks } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const parseTree = parse( attributes.originalContent );
	const hasInnerBlocks = get( parseTree, [ 0, 'innerBlocks' ], [] ).length;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = hasInnerBlocks ?
			sprintf(
				__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, extract any blocks it may contain, or remove it entirely.' ),
				originalName
			) :
			sprintf(
				__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
				originalName
			);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLarge isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
		if ( hasInnerBlocks ) {
			actions.push(
				<Button key="extract" onClick={ extractBlocks } isLarge>
					{ __( 'Keep inner blocks' ) }
				</Button>
			);
		}
	} else {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.' ),
			originalName
		);
	}

	return (
		<>
			<Warning actions={ actions }>
				{ messageHTML }
			</Warning>
			<RawHTML>{ originalUndelimitedContent }</RawHTML>
		</>
	);
}

const MissingEdit = withDispatch( ( dispatch, { clientId, attributes } ) => {
	const { replaceBlock } = dispatch( 'core/block-editor' );
	return {
		convertToHTML() {
			replaceBlock( clientId, createBlock( 'core/html', {
				content: attributes.originalUndelimitedContent,
			} ) );
		},
		extractBlocks() {
			replaceBlock( clientId, get(
				parse( attributes.originalContent ),
				[ 0, 'innerBlocks' ],
				[]
			) );
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
