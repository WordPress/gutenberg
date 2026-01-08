/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';

export default function BlockVisibilityToolbar( { clientIds } ) {
	const { blocks, canToggleBlockVisibility } = useSelect(
		( select ) => {
			const { getBlockName, getBlocksByClientId } =
				select( blockEditorStore );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				blocks: _blocks,
				canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
			};
		},
		[ clientIds ]
	);

	const hasHiddenBlock = blocks.some(
		( block ) => block.attributes.metadata?.blockVisibility === false
	);

	const hasBlockVisibilityButtonShownRef = useRef( false );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// If the block visibility button has been shown, we don't want to
	// remove it from the toolbar until the toolbar is rendered again
	// without it. Removing it beforehand can cause focus loss issues.
	// It needs to return focus from whence it came, and to do that,
	// we need to leave the button in the toolbar.
	useEffect( () => {
		if ( hasHiddenBlock ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ hasHiddenBlock ] );

	if ( ! hasHiddenBlock && ! hasBlockVisibilityButtonShownRef.current ) {
		return null;
	}

	const toggleBlockVisibility = () => {
		const attributesByClientId = Object.fromEntries(
			blocks?.map( ( { clientId, attributes } ) => [
				clientId,
				{
					metadata: cleanEmptyObject( {
						...attributes?.metadata,
						blockVisibility: hasHiddenBlock ? undefined : false,
					} ),
				},
			] )
		);
		updateBlockAttributes( clientIds, attributesByClientId, {
			uniqueByBlock: true,
		} );
	};

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					disabled={ ! canToggleBlockVisibility }
					icon={ hasHiddenBlock ? unseen : seen }
					label={ hasHiddenBlock ? __( 'Hidden' ) : __( 'Visible' ) }
					onClick={ toggleBlockVisibility }
				/>
			</ToolbarGroup>
		</>
	);
}
