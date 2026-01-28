/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { createPortal, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockEdit from '../block-edit';

// Container ID for the portal target
const CONTAINER_ID = 'block-editor-compat-mode-slot-fills';

/**
 * CompatModeSlotFills renders the edit function for compat mode blocks
 * in a hidden container in the top-level document. This allows SlotFills
 * (InspectorControls, BlockControls) to render into the correct slots
 * while the visual content is in the compat mode iframe.
 *
 * @return {Element|null} Portal with hidden block edit functions.
 */
export default function CompatModeSlotFills() {
	const [ container, setContainer ] = useState( null );

	// Create/get the portal container in the top-level document
	useEffect( () => {
		// Get the top-level document (not the iframe document)
		const topDocument = window.top?.document || document;

		let element = topDocument.getElementById( CONTAINER_ID );
		if ( ! element ) {
			element = topDocument.createElement( 'div' );
			element.id = CONTAINER_ID;
			element.className = 'block-editor-compat-mode-slot-fills';
			// Screen reader only styles
			element.style.cssText = `
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			`;
			element.setAttribute( 'aria-hidden', 'true' );
			topDocument.body.appendChild( element );
		}
		setContainer( element );

		return () => {
			// Clean up on unmount - but only if no other instances are using it
			// For now, leave it in the DOM
		};
	}, [] );

	// Get all blocks that have iframeCompatMode support
	const compatModeBlocks = useSelect( ( select ) => {
		const { getBlocks, getBlockAttributes, isBlockSelected, getSettings } =
			select( blockEditorStore );
		const { isCompatModeEditor } = getSettings();

		// Don't render if we're inside the compat mode editor (prevents recursion)
		if ( isCompatModeEditor ) {
			// eslint-disable-next-line no-console
			console.log( '[CompatModeSlotFills] Skipping - isCompatModeEditor is true' );
			return [];
		}

		const allBlocks = getBlocks();
		// eslint-disable-next-line no-console
		console.log( '[CompatModeSlotFills] allBlocks:', allBlocks.length, allBlocks.map( b => b.name ) );
		const result = [];

		function findCompatModeBlocks( blocks ) {
			for ( const block of blocks ) {
				const hasSupport = hasBlockSupport( block.name, 'iframeCompatMode' );
				// eslint-disable-next-line no-console
				console.log( '[CompatModeSlotFills] Block', block.name, 'hasIframeCompatMode:', hasSupport );
				if ( hasSupport ) {
					result.push( {
						clientId: block.clientId,
						name: block.name,
						attributes: getBlockAttributes( block.clientId ),
						isSelected: isBlockSelected( block.clientId ),
					} );
				}
				// Check inner blocks recursively
				if ( block.innerBlocks?.length ) {
					findCompatModeBlocks( block.innerBlocks );
				}
			}
		}

		findCompatModeBlocks( allBlocks );
		// eslint-disable-next-line no-console
		console.log( '[CompatModeSlotFills] Found compat mode blocks:', result.length );
		return result;
	} );

	if ( ! container || ! compatModeBlocks.length ) {
		return null;
	}

	return createPortal(
		<>
			{ compatModeBlocks.map( ( block ) => {
				const blockType = getBlockType( block.name );
				if ( ! blockType ) {
					return null;
				}

				return (
					<CompatModeBlockEdit
						key={ block.clientId }
						clientId={ block.clientId }
						name={ block.name }
						attributes={ block.attributes }
						isSelected={ block.isSelected }
					/>
				);
			} ) }
		</>,
		container
	);
}

/**
 * Renders a single compat mode block's edit function for SlotFills.
 */
function CompatModeBlockEdit( { clientId, name, attributes, isSelected } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Create a setAttributes function for this block
	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	return (
		<BlockEdit
			clientId={ clientId }
			name={ name }
			attributes={ attributes }
			setAttributes={ setAttributes }
			isSelected={ isSelected }
			// Pass empty context - the slots will still work
			context={ {} }
		/>
	);
}
