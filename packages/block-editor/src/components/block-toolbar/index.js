/**
 * WordPress dependencies
 */
import { ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockParentSelector from '../block-parent-selector';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import { useElementHoverFocusGestures } from './utils';
import ExpandedBlockControlsContainer from './expanded-block-controls-container';

export default function BlockToolbar( {
	hideDragHandle,
	__experimentalExpandedControl = false,
} ) {
	const {
		blockClientIds,
		blockClientId,
		blockType,
		hasParent,
		hasReducedUI,
		isValid,
		isVisual,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockMode,
			getBlockParents,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getSettings,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockRootClientId = getBlockRootClientId( selectedBlockClientId );
		const settings = getSettings();

		return {
			blockClientIds: selectedBlockClientIds,
			blockClientId: selectedBlockClientId,
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
			hasReducedUI: settings.hasReducedUI,
			rootClientId: blockRootClientId,
			hasParent: getBlockParents( selectedBlockClientId ).length > 0,
			isValid: selectedBlockClientIds.every( ( id ) =>
				isBlockValid( id )
			),
			isVisual: selectedBlockClientIds.every(
				( id ) => getBlockMode( id ) === 'visual'
			),
		};
	}, [] );

	const { toggleBlockHighlight } = useDispatch( 'core/block-editor' );
	const nodeRef = useRef();

	const showBlockHighlightGestures = useElementHoverFocusGestures( {
		ref: nodeRef,
		onChange( isFocused ) {
			if ( isFocused && hasReducedUI ) {
				return;
			}
			toggleBlockHighlight( blockClientId, isFocused );
		},
	} );

	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && isVisual;
	const isMultiToolbar = blockClientIds.length > 1;

	const Wrapper = __experimentalExpandedControl
		? ExpandedBlockControlsContainer
		: 'div';

	return (
		<Wrapper className="block-editor-block-toolbar">
			{ hasParent && ! isMultiToolbar && (
				<ToolbarGroup className="block-editor-block-toolbar__block-parent-selector-wrapper">
					<BlockParentSelector clientIds={ blockClientIds } />
				</ToolbarGroup>
			) }
			<div ref={ nodeRef } { ...showBlockHighlightGestures }>
				{ ( shouldShowVisualToolbar || isMultiToolbar ) && (
					<ToolbarGroup className="block-editor-block-toolbar__block-controls">
						<BlockSwitcher clientIds={ blockClientIds } />
						<BlockMover
							clientIds={ blockClientIds }
							hideDragHandle={ hideDragHandle || hasReducedUI }
						/>
					</ToolbarGroup>
				) }
			</div>
			{ shouldShowVisualToolbar && (
				<>
					<BlockControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
					<BlockFormatControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</Wrapper>
	);
}
