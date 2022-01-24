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
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import {
	useState,
	useRef,
	useEffect,
	useCallback,
	memo,
} from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListViewLeaf from './leaf';
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import ListViewBlockContents from './block-contents';
import BlockSettingsDropdown from '../block-settings-menu/block-settings-dropdown';
import { useListViewContext } from './context';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';

function ListViewBlock( {
	block,
	isDragged,
	isSelected,
	isBranchSelected,
	selectBlock,
	position,
	level,
	rowCount,
	siblingBlockCount,
	showBlockMovers,
	path,
	isExpanded,
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
	} = useListViewContext();

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
		setIsHovered( true );
		highlightBlock( clientId, true );
	}, [ clientId, setIsHovered, highlightBlock ] );
	const onMouseLeave = useCallback( () => {
		setIsHovered( false );
		highlightBlock( clientId, false );
	}, [ clientId, setIsHovered, highlightBlock ] );

	const selectEditorBlock = useCallback(
		( event ) => {
			event.stopPropagation();
			selectBlock( clientId );
		},
		[ clientId, selectBlock ]
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
		'is-selected': isSelected,
		'is-branch-selected':
			withExperimentalPersistentListViewFeatures && isBranchSelected,
		'is-dragging': isDragged,
		'has-single-cell': hideBlockActions,
	} );

	const blockInformation = useBlockDisplayInformation( clientId );
	const settingsAriaLabel = sprintf(
		// translators: %s: The title of the block.
		__( 'Options for %s block' ),
		blockInformation.title
	);

	return (
		<ListViewLeaf
			className={ classes }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
			id={ `list-view-block-${ clientId }` }
			data-block={ clientId }
			isExpanded={ isExpanded }
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
							label={ settingsAriaLabel }
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
		</ListViewLeaf>
	);
}

export default memo( ListViewBlock );
