/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import {
	createBlock,
	getBlockAttributes,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect, withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import InstallButton from './install-button';

function MissingBlockWarning( { attributes, convertToHTML, replaceBlock } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );
	const hasPermission = useSelect( ( select ) =>
		select( 'core/block-directory' ).hasInstallBlocksPermission()
	);

	const actions = [];
	let messageHTML;
	if ( hasPermission ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can try reinstalling the block, convert its content to a Custom HTML block, or remove it entirely.'
			),
			originalName
		);
		actions.push(
			<InstallButton
				key="install"
				blockName={ originalName }
				convertToBlock={ ( blockName ) => {
					const block = getBlockType( blockName );
					replaceBlock( block );
				} }
			/>
		);
	} else if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
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
			/* translators: %s: block name */
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
		replaceBlock( block ) {
			replaceBlock(
				clientId,
				createBlock(
					block.name,
					getBlockAttributes(
						block,
						attributes.originalUndelimitedContent
					)
				)
			);
		},
	};
} )( MissingBlockWarning );

export default MissingEdit;
