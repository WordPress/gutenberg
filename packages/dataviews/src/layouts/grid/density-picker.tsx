/**
 * WordPress dependencies
 */
import { RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { plus, lineSolid } from '@wordpress/icons';
import { useEffect } from '@wordpress/element';

const viewPortBreaks = {
	xhuge: { min: 2, max: 6, default: 4 },
	huge: { min: 2, max: 5, default: 4 },
	xlarge: { min: 2, max: 3, default: 3 },
	mobile: { min: 2, max: 3, default: 2 },
};

function useViewPortBreakpoint() {
	const isXHuge = useViewportMatch( 'xhuge', '>=' );
	const isHuge = useViewportMatch( 'huge', '>=' );
	const isXlarge = useViewportMatch( 'xlarge', '>=' );
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
	if ( isMobile ) {
		return 'mobile';
	}
	return null;
}

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
	setDensity: ( density: number ) => void;
} ) {
	const viewPort = useViewPortBreakpoint();
	useEffect( () => {
		setDensity( 0 );
	}, [ setDensity, viewPort ] );
	if ( ! viewPort ) {
		return null;
	}
	const breakValues = viewPortBreaks[ viewPort ];
	const densityToUse = density || breakValues.default;
	const rangeValue = getRangeValue( densityToUse, breakValues );

	const step = 100 / ( breakValues.max - breakValues.min + 1 );
	return (
		<>
			<Button
				size="compact"
				icon={ lineSolid }
				disabled={ rangeValue <= 0 }
				accessibleWhenDisabled
				label={ __( 'Decrease size' ) }
				onClick={ () => {
					setDensity( densityToUse + 1 );
				} }
			/>
			<RangeControl
				__nextHasNoMarginBottom
				showTooltip={ false }
				className="dataviews-density-picker__range-control"
				label={ __( 'Item size' ) }
				hideLabelFromVision
				value={ rangeValue }
				min={ 0 }
				max={ 100 }
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
			<Button
				size="compact"
				icon={ plus }
				disabled={ rangeValue >= 100 }
				accessibleWhenDisabled
				label={ __( 'Increase size' ) }
				onClick={ () => {
					setDensity( densityToUse - 1 );
				} }
			/>
		</>
	);
}
