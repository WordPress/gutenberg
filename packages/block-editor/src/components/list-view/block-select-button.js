/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Tooltip,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { Icon, lockSmall as lock, pinSmall } from '@wordpress/icons';
import { SPACE, ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		onClick,
		onToggleExpanded,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		ariaLabel,
		ariaDescribedBy,
		updateFocusAndSelection,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );
	const {
		getSelectedBlockClientIds,
		getPreviousBlockClientId,
		getBlockRootClientId,
		getBlockOrder,
		canRemoveBlocks,
	} = useSelect( blockEditorStore );
	const { removeBlocks } = useDispatch( blockEditorStore );
	const isMatch = useShortcutEventMatch();
	const isSticky = blockInformation?.positionType === 'sticky';

	const positionLabel = blockInformation?.positionLabel
		? sprintf(
				// translators: 1: Position of selected block, e.g. "Sticky" or "Fixed".
				__( 'Position: %1$s' ),
				blockInformation.positionLabel
		  )
		: '';

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart?.( event );
	};

	/**
	 * @param {KeyboardEvent} event
	 */
	function onKeyDownHandler( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		} else if (
			event.keyCode === BACKSPACE ||
			event.keyCode === DELETE ||
			isMatch( 'core/block-editor/remove', event )
		) {
			const selectedBlockClientIds = getSelectedBlockClientIds();
			const isDeletingSelectedBlocks =
				selectedBlockClientIds.includes( clientId );
			const firstBlockClientId = isDeletingSelectedBlocks
				? selectedBlockClientIds[ 0 ]
				: clientId;
			const firstBlockRootClientId =
				getBlockRootClientId( firstBlockClientId );

			const blocksToDelete = isDeletingSelectedBlocks
				? selectedBlockClientIds
				: [ clientId ];

			// Don't update the selection if the blocks cannot be deleted.
			if ( ! canRemoveBlocks( blocksToDelete, firstBlockRootClientId ) ) {
				return;
			}

			let blockToFocus =
				getPreviousBlockClientId( firstBlockClientId ) ??
				// If the previous block is not found (when the first block is deleted),
				// fallback to focus the parent block.
				firstBlockRootClientId;

			removeBlocks( blocksToDelete, false );

			// Update the selection if the original selection has been removed.
			const shouldUpdateSelection =
				selectedBlockClientIds.length > 0 &&
				getSelectedBlockClientIds().length === 0;

			// If there's no previous block nor parent block, focus the first block.
			if ( ! blockToFocus ) {
				blockToFocus = getBlockOrder()[ 0 ];
			}

			updateFocusAndSelection( blockToFocus, shouldUpdateSelection );
		}
	}

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ onClick }
				onKeyDown={ onKeyDownHandler }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onDragStart={ onDragStartHandler }
				onDragEnd={ onDragEnd }
				draggable={ draggable }
				href={ `#block-${ clientId }` }
				aria-label={ ariaLabel }
				aria-describedby={ ariaDescribedBy }
				aria-expanded={ isExpanded }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon
					icon={ blockInformation?.icon }
					showColors
					context="list-view"
				/>
				<HStack
					alignment="center"
					className="block-editor-list-view-block-select-button__label-wrapper"
					justify="flex-start"
					spacing={ 1 }
				>
					<span className="block-editor-list-view-block-select-button__title">
						<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
					</span>
					{ blockInformation?.anchor && (
						<span className="block-editor-list-view-block-select-button__anchor-wrapper">
							<Truncate
								className="block-editor-list-view-block-select-button__anchor"
								ellipsizeMode="auto"
							>
								{ blockInformation.anchor }
							</Truncate>
						</span>
					) }
					{ positionLabel && isSticky && (
						<Tooltip text={ positionLabel }>
							<span className="block-editor-list-view-block-select-button__sticky">
								<Icon icon={ pinSmall } />
							</span>
						</Tooltip>
					) }
					{ isLocked && (
						<span className="block-editor-list-view-block-select-button__lock">
							<Icon icon={ lock } />
						</span>
					) }
				</HStack>
			</Button>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
