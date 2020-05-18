/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridCell as TreeGridCell } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState } from '@wordpress/element';

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
import BlockSettingsMenu from '../block-settings-menu';

export default function BlockNavigationBlock( {
	block,
	onClick,
	isSelected,
	position,
	level,
	rowCount,
	showBlockMovers,
	terminatedLevels,
	path,
} ) {
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
		__experimentalWithEllipsisMenu: withEllipsisMenu,
		__experimentalWithEllipsisMenuMinLevel: ellipsisMenuMinLevel,
	} = useBlockNavigationContext();
	const ellipsisMenuClassName = classnames(
		'block-editor-block-navigation-block__menu-cell',
		{ 'is-visible': hasVisibleMovers }
	);

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
				colSpan={ hasRenderedMovers ? undefined : 3 }
			>
				{ ( props ) => (
					<div className="block-editor-block-navigation-block__contents-container">
						<DescenderLines
							level={ level }
							isLastRow={ position === rowCount }
							terminatedLevels={ terminatedLevels }
						/>
						<BlockNavigationBlockContents
							block={ block }
							onClick={ onClick }
							isSelected={ isSelected }
							position={ position }
							siblingCount={ siblingCount }
							level={ level }
							{ ...props }
						/>

						<BlockSettingsMenu clientIds={ [ clientId ] } />
						{ /*<BlockToolbar />*/ }
					</div>
				) }
			</TreeGridCell>
			{ hasRenderedMovers && (
				<>
					<TreeGridCell className={ moverCellClassName }>
						{ ( props ) => (
							<BlockMoverUpButton
								__experimentalOrientation="vertical"
								clientIds={ [ clientId ] }
								{ ...props }
							/>
						) }
					</TreeGridCell>
					<TreeGridCell className={ moverCellClassName }>
						{ ( props ) => (
							<BlockMoverDownButton
								__experimentalOrientation="vertical"
								clientIds={ [ clientId ] }
								{ ...props }
							/>
						) }
					</TreeGridCell>
				</>
			) }

			{ withEllipsisMenu && level >= ellipsisMenuMinLevel && (
				<TreeGridCell className={ ellipsisMenuClassName }>
					{ ( props ) => (
						<BlockSettingsDropdown
							clientIds={ [ clientId ] }
							icon={ moreVertical }
							{ ...props }
						/>
					) }
				</TreeGridCell>
			) }
		</BlockNavigationLeaf>
	);
}
