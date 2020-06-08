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
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockNavigationLeaf from './leaf';
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import DescenderLines from './descender-lines';
import BlockNavigationBlockContents from './block-contents';
import BlockSettingsDropdown from '../block-settings-menu/block-settings-dropdown';
import { useBlockNavigationContext } from './context';

export default function BlockNavigationBlock( {
	block,
	isSelected,
	selectBlock,
	position,
	level,
	rowCount,
	showBlockMovers,
	terminatedLevels,
	path,
} ) {
	const cellRef = useRef( null );
	const [ isHovered, setIsHovered ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );
	const { clientId } = block;

	// Subtract 1 from rowCount, as it includes the block appender.
	const siblingCount = rowCount - 1;
	const hasSiblings = siblingCount > 1;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const hasVisibleMovers = isHovered || isSelected || isFocused;
	const moverCellClassName = classnames(
		'block-editor-block-navigation-block__mover-cell',
		{ 'is-visible': hasVisibleMovers }
	);
	const {
		__experimentalFeatures: withBlockNavigationBlockSettings,
	} = useBlockNavigationContext();
	const blockNavigationBlockSettingsClassName = classnames(
		'block-editor-block-navigation-block__menu-cell',
		{ 'is-visible': hasVisibleMovers }
	);
	useEffect( () => {
		if ( isSelected ) {
			cellRef.current.focus();
		}
	}, [ isSelected ] );

	return (
		<BlockNavigationLeaf
			className={ classnames( {
				'is-selected': isSelected,
			} ) }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
			onFocus={ () => setIsFocused( true ) }
			onBlur={ () => setIsFocused( false ) }
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
		>
			<TreeGridCell
				className="block-editor-block-navigation-block__contents-cell"
				colSpan={ hasRenderedMovers ? undefined : 2 }
				ref={ cellRef }
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-block-navigation-block__contents-container">
						<DescenderLines
							level={ level }
							isLastRow={ position === rowCount }
							terminatedLevels={ terminatedLevels }
						/>
						<BlockNavigationBlockContents
							block={ block }
							onClick={ () => selectBlock( block.clientId ) }
							isSelected={ isSelected }
							position={ position }
							siblingCount={ siblingCount }
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
									__experimentalOrientation="vertical"
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
									__experimentalOrientation="vertical"
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

			{ withBlockNavigationBlockSettings && (
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
							__experimentalSelectBlock={ selectBlock }
						/>
					) }
				</TreeGridCell>
			) }
		</BlockNavigationLeaf>
	);
}
