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
import { Icon, lockSmall as lock, pinSmall } from '@wordpress/icons';
import { SPACE, ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { __, sprintf } from '@wordpress/i18n';
import { forwardRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import useListViewImages from './use-list-view-images';
import BlockOptionsRenameItem from './block-options-rename-item';

const SINGLE_CLICK = 1;

function ListViewBlockSelectButton(
	{
		className,
		onClick,
		onToggleExpanded,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		ariaLabel,
		ariaDescribedBy,
		updateFocusAndSelection,
		labelEditingMode,
		toggleLabelEditingMode,
		supportsBlockNaming,
		blockTitle,
		clientId,
		blockInformation,
		tabIndex,
		onFocus,
	},
	ref
) {
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
	const images = useListViewImages( { clientId, isExpanded } );

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

	useEffect( () => {
		if ( ! labelEditingMode ) {
			// Re-focus button element when existing edit mode.
			ref?.current?.focus();
		}
	}, [ labelEditingMode ] );

	return (
		<>
			<Button
				ref={ ref }
				className={ classnames(
					'block-editor-list-view-block-node',
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ ( event ) => {
					// Avoid click delays for blocks that don't support naming interaction.
					if ( ! supportsBlockNaming ) {
						onClick( event );
						return;
					}

					if ( event.detail === SINGLE_CLICK ) {
						onClick( event );
					}
				} }
				onDoubleClick={ ( event ) => {
					event.preventDefault();
					if ( ! supportsBlockNaming ) {
						return;
					}
					toggleLabelEditingMode( true );
				} }
				onKeyDown={ onKeyDownHandler }
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
					className="block-editor-list-view-block-node__label-wrapper"
					justify="flex-start"
					spacing={ 1 }
				>
					<span className="block-editor-list-view-block-node__title">
						<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
					</span>
					{ blockInformation?.anchor && (
						<span className="block-editor-list-view-block-node__anchor-wrapper">
							<Truncate
								className="block-editor-list-view-block-node__anchor"
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
					{ images.length ? (
						<span
							className="block-editor-list-view-block-select-button__images"
							aria-hidden
						>
							{ images.map( ( image, index ) => (
								<span
									className="block-editor-list-view-block-select-button__image"
									key={ `img-${ image.url }` }
									style={ {
										backgroundImage: `url(${ image.url })`,
										zIndex: images.length - index, // Ensure the first image is on top, and subsequent images are behind.
									} }
								/>
							) ) }
						</span>
					) : null }
					{ isLocked && (
						<span className="block-editor-list-view-block-node__lock">
							<Icon icon={ lock } />
						</span>
					) }
				</HStack>
				{ supportsBlockNaming && (
					<BlockOptionsRenameItem
						clientId={ clientId }
						onClick={ () => {
							toggleLabelEditingMode( true );
						} }
					/>
				) }
			</Button>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
