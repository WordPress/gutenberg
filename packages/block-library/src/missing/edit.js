/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { withDispatch, useSelect } from '@wordpress/data';
import {
	Warning,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { safeHTML } from '@wordpress/dom';

function MissingBlockWarning( { attributes, convertToHTML, clientId } ) {
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

	const actions = [];
	let messageHTML;

	let blockName = originalName;

	// Defaulting to "Unknown" if the Classic block isn't registered.
	if (
		! hasFreeformBlock &&
		( ! blockName || blockName === 'core/freeform' )
	) {
		blockName = _x( 'Unknown', 'The name we use for an unknown block.' );
	}

	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.'
			),
			blockName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } variant="primary">
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.'
			),
			blockName
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
