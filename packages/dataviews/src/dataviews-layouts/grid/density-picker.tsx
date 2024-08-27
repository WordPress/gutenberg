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

	const marks = useMemo(
		() =>
			Array.from(
				{ length: breakValues.max - breakValues.min + 1 },
				( _, i ) => {
					return {
						value: breakValues.min + i,
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
			label={ __( 'Preview size' ) }
			value={ breakValues.max + breakValues.min - densityToUse }
			marks={ marks }
			min={ breakValues.min }
			max={ breakValues.max }
			withInputField={ false }
			onChange={ ( value = 0 ) => {
				setDensity( breakValues.max + breakValues.min - value );
			} }
			step={ 1 }
		/>
	);
}
