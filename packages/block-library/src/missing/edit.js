/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { createBlock, rawHandler } from '@wordpress/blocks';
import { autop } from '@wordpress/autop';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Warning,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { safeHTML } from '@wordpress/dom';

export default function MissingEdit( { attributes, clientId } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const { hasFreeformBlock, hasHTMLBlock } = useSelect(
		( select ) => {
			const { canInsertBlockType, getBlockRootClientId } =
				select( blockEditorStore );

			return {
				hasFreeformBlock: canInsertBlockType(
					'core/freeform',
					getBlockRootClientId( clientId )
				),
				hasHTMLBlock: canInsertBlockType(
					'core/html',
					getBlockRootClientId( clientId )
				),
			};
		},
		[ clientId ]
	);
	const { replaceBlock, replaceBlocks } = useDispatch( blockEditorStore );

	function convertToHTML() {
		replaceBlock(
			clientId,
			createBlock( 'core/html', {
				content: originalUndelimitedContent,
			} )
		);
	}

	function convertToBlocks() {
		replaceBlocks(
			clientId,
			rawHandler( {
				HTML: autop( originalUndelimitedContent ).trim(),
			} )
		);
	}

	const actions = [];
	let messageHTML;

	const convertToBlocksButton = (
		<Button
			__next40pxDefaultSize
			key="convert-to-blocks"
			onClick={ convertToBlocks }
			variant="primary"
		>
			{ __( 'Convert to blocks' ) }
		</Button>
	);

	const getConvertToHtmlButton = ( variant ) => (
		<Button
			__next40pxDefaultSize
			key="keep-as-html"
			onClick={ convertToHTML }
			variant={ variant }
		>
			{ __( 'Keep as HTML' ) }
		</Button>
	);

	if (
		hasContent &&
		! hasFreeformBlock &&
		( ! originalName || originalName === 'core/freeform' )
	) {
		actions.push( convertToBlocksButton );
		if ( hasHTMLBlock ) {
			messageHTML = __(
				'It appears you are trying to use the deprecated Classic block. You can leave this block intact, convert its content to blocks, convert it to a Custom HTML block, or remove it entirely.'
			);
			actions.push( getConvertToHtmlButton( 'secondary' ) );
		} else {
			messageHTML = __(
				'It appears you are trying to use the deprecated Classic block. You can leave this block intact, convert its content to blocks, or remove it entirely.'
			);
		}
	} else if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave it as-is, convert it to custom HTML, or remove it.'
			),
			originalName
		);
		actions.push( getConvertToHtmlButton( 'primary' ) );
	} else {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave it as-is or remove it.'
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
