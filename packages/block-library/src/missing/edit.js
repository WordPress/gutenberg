/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

function MissingBlockWarning( { attributes, convertToHTML } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.'
			),
			originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLarge isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.'
			),
			originalName
		);
	}

	return (
		<>
			<Warning actions={ actions }>{ messageHTML }</Warning>
			<RawHTML>{ originalUndelimitedContent }</RawHTML>
		</>
	);
}

const MissingEdit = withDispatch( ( dispatch, { clientId, attributes } ) => {
	const { replaceBlock } = dispatch( 'core/block-editor' );
	return {
		convertToHTML() {
			replaceBlock(
				clientId,
				createBlock( 'core/html', {
					content: attributes.originalUndelimitedContent,
				} )
			);
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
