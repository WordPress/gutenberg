/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockParentSelector from '../block-parent-selector';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockSettingsMenu from '../block-settings-menu';
import { useShowMoversGestures } from './utils';
import { store as blockEditorStore } from '../../store';

export default function BlockToolbar( { hideDragHandle } ) {
	const {
		blockClientIds,
		blockClientId,
		blockType,
		hasFixedToolbar,
		hasReducedUI,
		isValid,
		isVisual,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getSettings,
		} = select( blockEditorStore );
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
			hasFixedToolbar: settings.hasFixedToolbar,
			hasReducedUI: settings.hasReducedUI,
			rootClientId: blockRootClientId,
			isValid: selectedBlockClientIds.every( ( id ) =>
				isBlockValid( id )
			),
			isVisual: selectedBlockClientIds.every(
				( id ) => getBlockMode( id ) === 'visual'
			),
		};
	}, [] );

	// Handles highlighting the current block outline on hover or focus of the
	// block type toolbar area.
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const nodeRef = useRef();
	const { showMovers, gestures: showMoversGestures } = useShowMoversGestures(
		{
			clientId: blockClientId,
			ref: nodeRef,
			onChange( isFocused ) {
				if ( isFocused && hasReducedUI ) {
					return;
				}
				toggleBlockHighlight( blockClientId, isFocused );
			},
		}
	);

	// Account for the cases where the block toolbar is rendered within the
	// header area and not contextually to the block.
	const displayHeaderToolbar =
		useViewportMatch( 'medium', '<' ) || hasFixedToolbar;

	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	const shouldShowMovers = displayHeaderToolbar || showMovers;

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && isVisual;
	const isMultiToolbar = blockClientIds.length > 1;

	const classes = classnames(
		'block-editor-block-toolbar',
		shouldShowMovers && 'is-showing-movers'
	);

	return (
		<div className={ classes }>
			{ ! isMultiToolbar && ! displayHeaderToolbar && (
				<BlockParentSelector clientIds={ blockClientIds } />
			) }
			<div ref={ nodeRef } { ...showMoversGestures }>
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
						group="parent"
						className="block-editor-block-toolbar__slot"
					/>
					<BlockControls.Slot
						group="block"
						className="block-editor-block-toolbar__slot"
					/>
					<BlockControls.Slot className="block-editor-block-toolbar__slot" />
					<BlockControls.Slot
						group="inline"
						className="block-editor-block-toolbar__slot"
					/>
					<BlockControls.Slot
						group="other"
						className="block-editor-block-toolbar__slot"
					/>
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}
