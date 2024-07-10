/**
 * WordPress dependencies
 */
import { RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { plus, lineSolid } from '@wordpress/icons';

const viewPortBreaks = {
	xhuge: [ 2, 6 ],
	huge: [ 2, 5 ],
	xlarge: [ 1, 3 ],
	mobile: [ 1, 2 ],
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

function getRangeValue( density: number, breakValues: number[] ) {
	const inverseDensity = breakValues[ 1 ] - density;
	const max = breakValues[ 1 ] - breakValues[ 0 ];
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
	if ( ! viewPort ) {
		return null;
	}
	const breakValues = viewPortBreaks[ viewPort ];
	const densityToUse = density || breakValues[ 1 ];
	const rangeValue = getRangeValue( densityToUse, breakValues );

	const step = 100 / ( breakValues[ 1 ] - breakValues[ 0 ] + 1 );
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
								( breakValues[ 1 ] - breakValues[ 0 ] ) ) /
								100 +
								breakValues[ 0 ]
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
