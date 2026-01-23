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
import BlockVariationTransformations from './block-variation-transformations';

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
	const priorityContentTransformationBlocks = {
		'core/paragraph': 1,
		'core/heading': 2,
		'core/list': 3,
		'core/quote': 4,
	};
	const transformations = useMemo( () => {
		const priorityTextTransformsNames = Object.keys(
			priorityContentTransformationBlocks
		);
		const groupedPossibleTransforms = possibleBlockTransformations.reduce(
			( accumulator, item ) => {
				const { name } = item;
				if ( priorityTextTransformsNames.includes( name ) ) {
					accumulator.priorityTextTransformations.push( item );
				} else {
					accumulator.restTransformations.push( item );
				}
				return accumulator;
			},
			{ priorityTextTransformations: [], restTransformations: [] }
		);
		/**
		 * If there is only one priority text transformation and it's a Quote,
		 * is should move to the rest transformations. This is because Quote can
		 * be a container for any block type, so in multi-block selection it will
		 * always be suggested, even for non-text blocks.
		 */
		if (
			groupedPossibleTransforms.priorityTextTransformations.length ===
				1 &&
			groupedPossibleTransforms.priorityTextTransformations[ 0 ].name ===
				'core/quote'
		) {
			const singleQuote =
				groupedPossibleTransforms.priorityTextTransformations.pop();
			groupedPossibleTransforms.restTransformations.push( singleQuote );
		}
		return groupedPossibleTransforms;
	}, [ possibleBlockTransformations ] );

	// Order the priority text transformations.
	transformations.priorityTextTransformations.sort(
		( { name: currentName }, { name: nextName } ) => {
			return priorityContentTransformationBlocks[ currentName ] <
				priorityContentTransformationBlocks[ nextName ]
				? -1
				: 1;
		}
	);
	return transformations;
}

const BlockTransformationsMenu = ( {
	className,
	possibleBlockTransformations,
	possibleBlockVariationTransformations,
	onSelect,
	onSelectVariation,
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
				{ !! possibleBlockVariationTransformations?.length && (
					<BlockVariationTransformations
						transformations={
							possibleBlockVariationTransformations
						}
						blocks={ blocks }
						onSelect={ onSelectVariation }
					/>
				) }
				{ priorityTextTransformations.map( ( item ) => (
					<BlockTransformationItem
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
		<BlockTransformationItem
			key={ item.name }
			item={ item }
			onSelect={ onSelect }
			setHoveredTransformItemName={ setHoveredTransformItemName }
		/>
	) );
}

function BlockTransformationItem( {
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
