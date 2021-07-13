/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import {
	Warning,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { safeHTML } from '@wordpress/dom';

function MissingBlockWarning( { attributes, convertToHTML } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.'
			),
			originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.'
			),
			originalName
		);
	}

	return (
		<div { ...useBlockProps( { className: 'has-warning' } ) }>
			<Warning actions={ actions }>{ messageHTML }</Warning>
			<RawHTML>{ safeHTML( originalUndelimitedContent ) }</RawHTML>
		</div>
	);
}

const MissingEdit = withDispatch( ( dispatch, { clientId, attributes } ) => {
	const { replaceBlock } = dispatch( blockEditorStore );
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
