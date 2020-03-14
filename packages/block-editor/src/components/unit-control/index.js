/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const { __defaultUnits, __getComputedSize } = BaseUnitControl;

export default function UnitControl( { units: unitsProp, ...props } ) {
	const isCustomUnitsDisabled = useIsCustomUnitsDisabled();

	// Disable units if specified by add_theme_support
	const units = isCustomUnitsDisabled ? false : unitsProp;

	return <BaseUnitControl units={ units } { ...props } />;
}

// Hoisting statics from the BaseUnitControl
UnitControl.__defaultUnits = __defaultUnits;
UnitControl.__getComputedSize = __getComputedSize;

export function useIsCustomUnitsDisabled() {
	const isDisabled = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return !! getSettings().__experimentalDisableCustomUnits;
	}, [] );

	return isDisabled;
}
