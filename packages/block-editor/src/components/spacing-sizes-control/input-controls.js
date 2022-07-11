/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SpacingRangeControl from './spacing-range-control';
import {
	ALL_SIDES,
	LABELS,
	getSpacingPresetSlug,
	getSliderValueFromSlug,
} from './utils';

export default function BoxInputControls( {
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	onChange,
	...props
} ) {
	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

	const createHandleOnChange = ( side ) => ( next ) => {
		// const { altKey } = event;
		const altKey = null;
		const nextValues = { ...props.values };
		nextValues[ side ] = next;

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
			switch ( side ) {
				case 'top':
					nextValues.bottom = next;
					break;
				case 'bottom':
					nextValues.top = next;
					break;
				case 'left':
					nextValues.right = next;
					break;
				case 'right':
					nextValues.left = next;
					break;
			}
		}

		onChange( nextValues );
	};

	return (
		<Flex className="component-spacing-sizes-control__input-controls-wrapper">
			<Flex
				gap={ 0 }
				align="top"
				direction="column"
				className="component-spacing-sizes-control__input-controls"
			>
				{ filteredSides.map( ( side ) => {
					const slug = getSpacingPresetSlug( values[ side ] );
					const value = getSliderValueFromSlug(
						slug,
						props.spacingSizes
					);

					return (
						<SpacingRangeControl
							{ ...props }
							value={ value }
							label={ LABELS[ side ] }
							key={ `box-control-${ side }` }
							withInputField={ false }
							side={ side }
							onChange={ createHandleOnChange( side ) }
						/>
					);
				} ) }
			</Flex>
		</Flex>
	);
}
