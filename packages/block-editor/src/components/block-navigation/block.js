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
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockNavigationLeaf from './leaf';
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import BlockNavigationBlockContents from './block-contents';
import BlockSettingsDropdown from '../block-settings-menu/block-settings-dropdown';
import { useBlockNavigationContext } from './context';

export default function BlockNavigationBlock( {
	block,
	isSelected,
	onClick,
	position,
	level,
	rowCount,
	siblingBlockCount,
	showBlockMovers,
	path,
} ) {
	const cellRef = useRef( null );
	const [ isHovered, setIsHovered ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );
	const { clientId } = block;
	const { isDragging, blockParents } = useSelect(
		( select ) => {
			const {
				isBlockBeingDragged,
				isAncestorBeingDragged,
				getBlockParents,
			} = select( 'core/block-editor' );

			return {
				isDragging:
					isBlockBeingDragged( clientId ) ||
					isAncestorBeingDragged( clientId ),
				blockParents: getBlockParents( clientId ),
			};
		},
		[ clientId ]
	);

	const { selectBlock: selectEditorBlock } = useDispatch(
		'core/block-editor'
	);

	const hasSiblings = siblingBlockCount > 0;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const hasVisibleMovers = isHovered || isFocused;
	const moverCellClassName = classnames(
		'block-editor-block-navigation-block__mover-cell',
		{ 'is-visible': hasVisibleMovers }
	);
	const {
		__experimentalFeatures: withExperimentalFeatures,
	} = useBlockNavigationContext();
	const blockNavigationBlockSettingsClassName = classnames(
		'block-editor-block-navigation-block__menu-cell',
		{ 'is-visible': hasVisibleMovers }
	);
	useEffect( () => {
		if ( withExperimentalFeatures && isSelected ) {
			cellRef.current.focus();
		}
	}, [ withExperimentalFeatures, isSelected ] );

	return (
		<BlockNavigationLeaf
			className={ classnames( {
				'is-selected': isSelected,
				'is-dragging': isDragging,
			} ) }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
			onFocus={ () => setIsFocused( true ) }
			onBlur={ () => setIsFocused( false ) }
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
			id={ `block-navigation-block-${ clientId }` }
			data-block={ clientId }
		>
			<TreeGridCell
				className="block-editor-block-navigation-block__contents-cell"
				colSpan={ hasRenderedMovers ? undefined : 2 }
				ref={ cellRef }
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-block-navigation-block__contents-container">
						<BlockNavigationBlockContents
							block={ block }
							onClick={ () => onClick( block.clientId ) }
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

			{ withExperimentalFeatures && (
				<TreeGridCell
					className={ blockNavigationBlockSettingsClassName }
				>
					{ ( { ref, tabIndex, onFocus } ) => (
						<BlockSettingsDropdown
							clientIds={ [ clientId ] }
							icon={ moreVertical }
							toggleProps={ {
								ref,
								tabIndex,
								onFocus,
							} }
							disableOpenOnArrowDown
							__experimentalSelectBlock={ onClick }
						>
							{ ( { onClose } ) => (
								<MenuGroup>
									<MenuItem
										onClick={ async () => {
											if ( blockParents.length ) {
												// If the block to select is inside a dropdown, we need to open the dropdown.
												// Otherwise focus won't transfer to the block.
												for ( const parent of blockParents ) {
													await selectEditorBlock(
														parent
													);
												}
											} else {
												// If clientId is already selected, it won't be focused (see block-wrapper.js)
												// This removes the selection first to ensure the focus will always switch.
												await selectEditorBlock( null );
											}
											await selectEditorBlock( clientId );
											onClose();
										} }
									>
										{ __( 'Go to block' ) }
									</MenuItem>
								</MenuGroup>
							) }
						</BlockSettingsDropdown>
					) }
				</TreeGridCell>
			) }
		</BlockNavigationLeaf>
	);
}
