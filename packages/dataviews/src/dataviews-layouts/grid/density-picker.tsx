/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';

const viewportBreaks = {
	xhuge: { min: 3, max: 6, default: 5 },
	huge: { min: 2, max: 4, default: 4 },
	xlarge: { min: 2, max: 3, default: 3 },
	large: { min: 1, max: 2, default: 2 },
	mobile: { min: 1, max: 2, default: 2 },
};

function useViewPortBreakpoint() {
	const isXHuge = useViewportMatch( 'xhuge', '>=' );
	const isHuge = useViewportMatch( 'huge', '>=' );
	const isXlarge = useViewportMatch( 'xlarge', '>=' );
	const isLarge = useViewportMatch( 'large', '>=' );
	const isMobile = useViewportMatch( 'mobile', '>=' );

	if ( isXHuge ) {
		return 'xhuge';
	}
	if ( isHuge ) {
		return 'huge';
	}
	if ( isXlarge ) {
		return 'xlarge';
	}
	if ( isLarge ) {
		return 'large';
	}
	if ( isMobile ) {
		return 'mobile';
	}
	return null;
}

// Value is number from 0 to 100 representing how big an item is in the grid
// 100 being the biggest and 0 being the smallest.
// The size is relative to the viewport size, if one a given viewport the
// number of allowed items in a grid is 3 to 6 a 0 ( the smallest ) will mean that the grid will
// have 6 items in a row, a 100 ( the biggest ) will mean that the grid will have 3 items in a row.
// A value of 75 will mean that the grid will have 4 items in a row.
function getRangeValue(
	density: number,
	breakValues: { min: number; max: number; default: number }
) {
	const inverseDensity = breakValues.max - density;
	const max = breakValues.max - breakValues.min;
	return Math.round( ( inverseDensity * 100 ) / max );
}

export default function DensityPicker( {
	density,
	setDensity,
}: {
	density: number;
	setDensity: React.Dispatch< React.SetStateAction< number > >;
} ) {
	const viewport = useViewPortBreakpoint();
	useEffect( () => {
		setDensity( ( _density ) => {
			if ( ! viewport || ! _density ) {
				return 0;
			}
			const breakValues = viewportBreaks[ viewport ];
			if ( _density < breakValues.min ) {
				return breakValues.min;
			}
			if ( _density > breakValues.max ) {
				return breakValues.max;
			}
			return _density;
		} );
	}, [ setDensity, viewport ] );
	const breakValues = viewportBreaks[ viewport || 'mobile' ];
	const densityToUse = density || breakValues.default;
	const rangeValue = getRangeValue( densityToUse, breakValues );

	const step = 100 / ( breakValues.max - breakValues.min + 1 );
	const marks = useMemo(
		() =>
			Array.from(
				{ length: breakValues.max - breakValues.min + 1 },
				( _, i ) => {
					const value = getRangeValue(
						i + breakValues.min,
						breakValues
					);
					return {
						value,
					};
				}
			),
		[ breakValues ]
	);
	if ( ! viewport ) {
		return null;
	}
	return (
		<RangeControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			showTooltip={ false }
			className="dataviews-density-picker__range-control"
			label={ __( 'Preview size' ) }
			value={ rangeValue }
			min={ 0 }
			max={ 100 }
			marks={ marks }
			withInputField={ false }
			onChange={ ( value = 0 ) => {
				const inverseValue = 100 - value;
				setDensity(
					Math.round(
						( inverseValue *
							( breakValues.max - breakValues.min ) ) /
							100 +
							breakValues.min
					)
				);
			} }
			step={ step }
		/>
	);
}
