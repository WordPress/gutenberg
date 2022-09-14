/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import {
	getBlockMenuDefaultClassName,
	switchToBlockType,
} from '@wordpress/blocks';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import PreviewBlockPopover from './preview-block-popover';

/**
 * Helper hook to group transformations to display them in a specific order in the UI.
 * For now we group only priority content driven transformations(ex. paragraph -> heading).
 *
 * Later on we could also group 'layout' transformations(ex. paragraph -> group) and
 * display them in different sections.
 *
 * @param {Object[]} possibleBlockTransformations The available block transformations.
 * @return {Record<string, Object[]>} The grouped block transformations.
 */
function useGroupedTransforms( possibleBlockTransformations ) {
	const priorityContentTranformationBlocks = {
		'core/paragraph': 1,
		'core/heading': 2,
		'core/list': 3,
		'core/quote': 4,
	};
	const transformations = useMemo( () => {
		const priorityTextTranformsNames = Object.keys(
			priorityContentTranformationBlocks
		);
		return possibleBlockTransformations.reduce(
			( accumulator, item ) => {
				const { name } = item;
				if ( priorityTextTranformsNames.includes( name ) ) {
					accumulator.priorityTextTransformations.push( item );
				} else {
					accumulator.restTransformations.push( item );
				}
				return accumulator;
			},
			{ priorityTextTransformations: [], restTransformations: [] }
		);
	}, [ possibleBlockTransformations ] );

	// Order the priority text transformations.
	transformations.priorityTextTransformations.sort(
		( { name: currentName }, { name: nextName } ) => {
			return priorityContentTranformationBlocks[ currentName ] <
				priorityContentTranformationBlocks[ nextName ]
				? -1
				: 1;
		}
	);
	return transformations;
}

const BlockTransformationsMenu = ( {
	className,
	possibleBlockTransformations,
	onSelect,
	blocks,
} ) => {
	const [ hoveredTransformItemName, setHoveredTransformItemName ] =
		useState();

	const { priorityTextTransformations, restTransformations } =
		useGroupedTransforms( possibleBlockTransformations );
	// We have to check if both content transformations(priority and rest) are set
	// in order to create a separate MenuGroup for them.
	const hasBothContentTransformations =
		priorityTextTransformations.length && restTransformations.length;
	const restTransformItems = !! restTransformations.length && (
		<RestTransformationItems
			restTransformations={ restTransformations }
			onSelect={ onSelect }
			setHoveredTransformItemName={ setHoveredTransformItemName }
		/>
	);
	return (
		<>
			<MenuGroup label={ __( 'Transform to' ) } className={ className }>
				{ hoveredTransformItemName && (
					<PreviewBlockPopover
						blocks={ switchToBlockType(
							blocks,
							hoveredTransformItemName
						) }
					/>
				) }
				{ priorityTextTransformations.map( ( item ) => (
					<BlockTranformationItem
						key={ item.name }
						item={ item }
						onSelect={ onSelect }
						setHoveredTransformItemName={
							setHoveredTransformItemName
						}
					/>
				) ) }
				{ ! hasBothContentTransformations && restTransformItems }
			</MenuGroup>
			{ !! hasBothContentTransformations && (
				<MenuGroup className={ className }>
					{ restTransformItems }
				</MenuGroup>
			) }
		</>
	);
};

function RestTransformationItems( {
	restTransformations,
	onSelect,
	setHoveredTransformItemName,
} ) {
	return restTransformations.map( ( item ) => (
		<BlockTranformationItem
			key={ item.name }
			item={ item }
			onSelect={ onSelect }
			setHoveredTransformItemName={ setHoveredTransformItemName }
		/>
	) );
}

function BlockTranformationItem( {
	item,
	onSelect,
	setHoveredTransformItemName,
} ) {
	const { name, icon, title, isDisabled } = item;
	return (
		<MenuItem
			className={ getBlockMenuDefaultClassName( name ) }
			onClick={ ( event ) => {
				event.preventDefault();
				onSelect( name );
			} }
			disabled={ isDisabled }
			onMouseLeave={ () => setHoveredTransformItemName( null ) }
			onMouseEnter={ () => setHoveredTransformItemName( name ) }
		>
			<BlockIcon icon={ icon } showColors />
			{ title }
		</MenuItem>
	);
}

export default BlockTransformationsMenu;
