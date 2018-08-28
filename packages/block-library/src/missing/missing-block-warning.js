/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Warning } from '@wordpress/editor';

export const name = 'core/unknown';

export function MissingBlockWarning( { attributes, removeBlock, convertToHTML } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [
		<Button key="remove" onClick={ removeBlock } isLarge>
			{ __( 'Remove Block' ) }
		</Button>,
	];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__( 'Your site doesn\'t include support for the <code>%s</code> block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
			originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLarge isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			__( 'Your site doesn\'t include support for the <code>%s</code> block. You can leave this block intact or remove it entirely.' ),
			originalName
		);
	}

	return (
		<Warning actions={ actions }>
			<span dangerouslySetInnerHTML={ { __html: messageHTML } } />
		</Warning>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/editor' );
		return {
			block: getBlock( clientId ),
		};
	} ),
	withDispatch( ( dispatch, { block, attributes } ) => {
		const { replaceBlock, removeBlock } = dispatch( 'core/editor' );
		return {
			removeBlock() {
				removeBlock( block.clientId );
			},
			convertToHTML() {
				replaceBlock( block.clientId, createBlock( 'core/html', {
					content: attributes.originalUndelimitedContent,
				} ) );
			},
		};
	} ),
] )( MissingBlockWarning );

