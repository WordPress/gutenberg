/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import {
	getBlockMenuDefaultClassName,
	getBlockTransformationResults,
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
		const groupedPossibleTransforms = possibleBlockTransformations.reduce(
			( accumulator, item ) => {
				const { name, variation } = item; // only default versions for text transforms
				if (
					priorityTextTranformsNames.includes( name ) &&
					! variation
				) {
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
	possibleBlockVariationTransformations,
	onSelect,
	onSelectVariation,
	blocks,
} ) => {
	const [ hoveredTransformItem, setHoveredTransformItem ] = useState();

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
			setHoveredTransformItem={ setHoveredTransformItem }
		/>
	);

	function getTransformPreview( { name, variation, transform } ) {
		return getBlockTransformationResults(
			blocks,
			name,
			transform,
			variation
		);
	}

	return (
		<>
			<MenuGroup label={ __( 'Transform to' ) } className={ className }>
				{ hoveredTransformItem && (
					<PreviewBlockPopover
						blocks={ getTransformPreview( hoveredTransformItem ) }
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
					<BlockTranformationItem
						key={ item.id }
						item={ item }
						onSelect={ onSelect }
						setHoveredTransformItem={ setHoveredTransformItem }
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
	setHoveredTransformItem,
} ) {
	return restTransformations.map( ( item ) => (
		<BlockTranformationItem
			key={ item.id }
			item={ item }
			onSelect={ onSelect }
			setHoveredTransformItem={ setHoveredTransformItem }
		/>
	) );
}

function BlockTranformationItem( { item, onSelect, setHoveredTransformItem } ) {
	const { name, variation, icon, title, isDisabled, transform } = item;
	return (
		<MenuItem
			className={ getBlockMenuDefaultClassName( name ) }
			onClick={ ( event ) => {
				event.preventDefault();
				onSelect( { name, variation, transform } );
			} }
			disabled={ isDisabled }
			onMouseLeave={ () => setHoveredTransformItem( null ) }
			onMouseEnter={ () =>
				setHoveredTransformItem( { name, variation, transform } )
			}
		>
			<BlockIcon icon={ icon } showColors />
			{ title }
		</MenuItem>
	);
}

export default BlockTransformationsMenu;
