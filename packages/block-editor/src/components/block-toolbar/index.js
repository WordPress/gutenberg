/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockParent from '../block-parent';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import { useShowMoversGestures, useToggleBlockHighlight } from './utils';

export default function BlockToolbar( { hideDragHandle } ) {
	const {
		blockClientIds,
		blockClientId,
		hasFixedToolbar,
		isValid,
		mode,
		moverDirection,
	} = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
			getSettings,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockRootClientId = getBlockRootClientId( selectedBlockClientId );

		const { __experimentalMoverDirection } =
			getBlockListSettings( blockRootClientId ) || {};

		return {
			blockClientIds: selectedBlockClientIds,
			blockClientId: selectedBlockClientId,
			hasFixedToolbar: getSettings().hasFixedToolbar,
			rootClientId: blockRootClientId,
			isValid:
				selectedBlockClientIds.length === 1
					? isBlockValid( selectedBlockClientIds[ 0 ] )
					: null,
			mode:
				selectedBlockClientIds.length === 1
					? getBlockMode( selectedBlockClientIds[ 0 ] )
					: null,
			moverDirection: __experimentalMoverDirection,
		};
	}, [] );

	const toggleBlockHighlight = useToggleBlockHighlight( blockClientId );
	const nodeRef = useRef();

	const { showMovers, gestures: showMoversGestures } = useShowMoversGestures(
		{
			ref: nodeRef,
			onChange: toggleBlockHighlight,
		}
	);

	const displayHeaderToolbar =
		useViewportMatch( 'medium', '<' ) || hasFixedToolbar;

	const shouldShowMovers = displayHeaderToolbar || showMovers;

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && mode === 'visual';
	const isMultiToolbar = blockClientIds.length > 1;

	const animatedMoverStyles = {
		opacity: shouldShowMovers ? 1 : 0,
		transform: shouldShowMovers ? 'translateX(0px)' : 'translateX(100%)',
	};

	const animatedBlockParentStyles = {
		opacity: shouldShowMovers ? 1 : 0,
		transform: shouldShowMovers ? 'translateY(-55px)' : 'translateY(0)',
		transitionDelay: shouldShowMovers ? 0 : 0,
	};

	const classes = classnames(
		'block-editor-block-toolbar',
		! displayHeaderToolbar && 'has-responsive-movers'
	);

	return (
		<div className={ classes }>
			<div
				className="block-editor-block-toolbar__mover-switcher-container"
				ref={ nodeRef }
			>
				<div
					className="block-editor-block-toolbar__mover-trigger-container"
					{ ...showMoversGestures }
				>
					<div
						className="block-editor-block-toolbar__mover-trigger-wrapper"
						style={ animatedMoverStyles }
					>
						<BlockMover
							clientIds={ blockClientIds }
							__experimentalOrientation={ moverDirection }
							hideDragHandle={ hideDragHandle }
						/>
					</div>
				</div>

				<div
					className="block-editor-block-toolbar__block-parent-wrapper"
					style={ animatedBlockParentStyles }
				>
					<BlockParent clientIds={ blockClientIds } />
				</div>

				{ ( shouldShowVisualToolbar || isMultiToolbar ) && (
					<div
						{ ...showMoversGestures }
						className="block-editor-block-toolbar__block-switcher-wrapper"
					>
						<BlockSwitcher clientIds={ blockClientIds } />
					</div>
				) }
			</div>

			{ shouldShowVisualToolbar && ! isMultiToolbar && (
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
		</div>
	);
}
