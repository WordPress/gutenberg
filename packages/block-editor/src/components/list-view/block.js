/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalTreeGridCell as TreeGridCell,
	__experimentalTreeGridItem as TreeGridItem,
	__experimentalTreeGridRow as TreeGridRow,
	__unstableUseMotionValue as useMotionValue,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import ListViewBlockContents from './block-contents';
import BlockSettingsDropdown from '../block-settings-menu/block-settings-dropdown';
import { useListViewContext } from './context';
import { store as blockEditorStore } from '../../store';
import { isClientIdSelected } from './utils';

const ROW_VARIANTS = {
	init: {
		opacity: 0,
	},
	open: {
		opacity: 1,
	},
};
const DRAG_CONSTANTS = { left: -10, right: 10 };

export default function ListViewBlock( {
	block,
	selectBlock,
	position,
	level,
	rowCount,
	siblingBlockCount,
	showBlockMovers,
	isExpanded,
	animateToggleOpen,
	setPosition,
	moveItem,
	listPosition,
	parentId,
	draggingId,
	dragStart,
	dragEnd,
} ) {
	const cellRef = useRef( null );
	const [ isHovered, setIsHovered ] = useState( false );
	const { clientId } = block;

	const { toggleBlockHighlight } = useDispatch( blockEditorStore );

	const {
		__experimentalFeatures: withExperimentalFeatures,
		__experimentalPersistentListViewFeatures: withExperimentalPersistentListViewFeatures,
		__experimentalHideContainerBlockActions: hideContainerBlockActions,
		isTreeGridMounted,
		expand,
		collapse,
		useAnimation,
	} = useListViewContext();

	const {
		isBranchSelected,
		isSelected,
		dropContainer,
		dropSibling,
	} = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getSelectedBlockClientIds,
				getBlockParents,
				canInsertBlocks,
			} = select( blockEditorStore );

			const selectedClientIds = withExperimentalPersistentListViewFeatures
				? getSelectedBlockClientIds()
				: [ getSelectedBlockClientId() ];
			const blockParents = getBlockParents( clientId );
			const _isSelected = isClientIdSelected(
				clientId,
				selectedClientIds
			);
			return {
				isSelected: _isSelected,
				isBranchSelected:
					_isSelected ||
					blockParents.some( ( id ) => {
						return isClientIdSelected( id, selectedClientIds );
					} ),
				dropContainer:
					draggingId &&
					draggingId !== clientId &&
					canInsertBlocks( [ draggingId ], clientId ),
				dropSibling:
					draggingId &&
					draggingId !== clientId &&
					canInsertBlocks( [ draggingId ], parentId ),
			};
		},
		[ withExperimentalPersistentListViewFeatures, clientId, draggingId ]
	);

	const hasSiblings = siblingBlockCount > 0;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const moverCellClassName = classnames(
		'block-editor-list-view-block__mover-cell',
		{ 'is-visible': isHovered || isSelected }
	);

	const listViewBlockSettingsClassName = classnames(
		'block-editor-list-view-block__menu-cell',
		{ 'is-visible': isHovered || isSelected }
	);

	useEffect( () => {
		setPosition( listPosition, {
			...{
				clientId,
				dropContainer,
				dropSibling,
				parentId,
				isLastChild: position === siblingBlockCount,
			},
		} );
		return () => {
			setPosition( listPosition, undefined );
		};
	}, [
		listPosition,
		draggingId,
		dropContainer,
		dropSibling,
		position,
		siblingBlockCount,
	] );

	// If ListView has experimental features related to the Persistent List View,
	// only focus the selected list item on mount; otherwise the list would always
	// try to steal the focus from the editor canvas.
	useEffect( () => {
		if (
			withExperimentalPersistentListViewFeatures &&
			! isTreeGridMounted &&
			isSelected
		) {
			cellRef.current.focus();
		}
	}, [] );

	const highlightBlock = withExperimentalPersistentListViewFeatures
		? toggleBlockHighlight
		: () => {};

	const onMouseEnter = useCallback( () => {
		if ( draggingId ) {
			return;
		}
		setIsHovered( true );
		highlightBlock( clientId, true );
	}, [ clientId, setIsHovered, highlightBlock, draggingId ] );
	const onMouseLeave = useCallback( () => {
		setIsHovered( false );
		highlightBlock( clientId, false );
	}, [ clientId, setIsHovered, highlightBlock ] );

	const selectEditorBlock = useCallback(
		( event ) => {
			if ( draggingId ) {
				return;
			}
			event.stopPropagation();
			selectBlock( clientId );
		},
		[ clientId, selectBlock, draggingId ]
	);

	const toggleExpanded = useCallback(
		( event ) => {
			event.stopPropagation();
			if ( isExpanded === true ) {
				collapse( clientId );
			} else if ( isExpanded === false ) {
				expand( clientId );
			}
		},
		[ clientId, expand, collapse, isExpanded ]
	);

	const showBlockActions =
		withExperimentalFeatures &&
		//hide actions for blocks like core/widget-areas
		( ! hideContainerBlockActions ||
			( hideContainerBlockActions && level > 1 ) );

	const hideBlockActions = withExperimentalFeatures && ! showBlockActions;

	let colSpan;
	if ( hasRenderedMovers ) {
		colSpan = 2;
	} else if ( hideBlockActions ) {
		colSpan = 3;
	}

	const classes = classnames( {
		'block-editor-list-view-leaf': true,
		'is-selected': isSelected,
		'is-branch-selected':
			withExperimentalPersistentListViewFeatures && isBranchSelected,
		'is-moving': draggingId === clientId, //avoid is-dragging which has an !important rule
		'is-hovered': isHovered,
		'has-single-cell': hideBlockActions,
	} );

	const velocity = useMotionValue( 0 );
	const onDrag = ( event, info ) => {
		// When swapping items with a neighbor a positive translate value is moving down, and a
		// negative value is moving up in the onViewportBoxUpdate callback.
		//
		// However, when skipping over items, we need mouse velocity to understand if the user is
		// dragging up or down. This is because with the view box in the same position, the
		// originPoint is modified and the translate value will flip its sign.
		//
		// Velocity is not available in onViewportBoxUpdate, so we set this motion value here:
		velocity.set( info.velocity.y );
	};

	const blockDrag = ( box, delta ) => {
		if ( draggingId === clientId ) {
			moveItem( {
				block,
				translate: delta.y.translate,
				translateX: delta.x.translate,
				velocity,
				listPosition,
			} );
		}
	};

	return (
		<TreeGridRow
			className={ classes }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			level={ level }
			positionInSet={ position }
			setSize={ rowCount }
			id={ `list-view-block-${ clientId }` }
			data-block={ clientId }
			isExpanded={ isExpanded }
			useAnimation={ useAnimation }
			variants={ ROW_VARIANTS }
			animate="open"
			initial={ useAnimation && animateToggleOpen ? 'init' : false }
			drag
			dragConstraints={ DRAG_CONSTANTS }
			onDragStart={ dragStart }
			onDrag={ onDrag }
			onDragEnd={ dragEnd }
			onViewportBoxUpdate={ blockDrag }
			layoutId={ `list-view-block-${ clientId }` }
		>
			<TreeGridCell
				className="block-editor-list-view-block__contents-cell"
				colSpan={ colSpan }
				ref={ cellRef }
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-list-view-block__contents-container">
						<ListViewBlockContents
							block={ block }
							onClick={ selectEditorBlock }
							onToggleExpanded={ toggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							ref={ ref }
							tabIndex={ tabIndex }
							onFocus={ onFocus }
						/>
					</div>
				) }
			</TreeGridCell>
			{ hasRenderedMovers && (
				<>
					<TreeGridCell
						className={ moverCellClassName }
						withoutGridItem
					>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverUpButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverDownButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
					</TreeGridCell>
				</>
			) }

			{ showBlockActions && (
				<TreeGridCell className={ listViewBlockSettingsClassName }>
					{ ( { ref, tabIndex, onFocus } ) => (
						<BlockSettingsDropdown
							clientIds={ [ clientId ] }
							icon={ moreVertical }
							toggleProps={ {
								ref,
								className: 'block-editor-list-view-block__menu',
								tabIndex,
								onFocus,
							} }
							disableOpenOnArrowDown
							__experimentalSelectBlock={ selectEditorBlock }
						/>
					) }
				</TreeGridCell>
			) }
		</TreeGridRow>
	);
}
