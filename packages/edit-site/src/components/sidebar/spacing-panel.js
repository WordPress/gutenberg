/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalBoxControl as BoxControl,
	PanelBody,
} from '@wordpress/components';
import { __experimentalUseCustomSides as useCustomSides } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

const isWeb = Platform.OS === 'web';
const CSS_UNITS = [
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
	},
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
	},
];

export function useHasSpacingPanel( context ) {
	const hasPadding = useHasPadding( context );
	const hasMargin = useHasMargin( context );

	return hasPadding || hasMargin;
}

function useHasPadding( { name, supports } ) {
	const settings = useEditorFeature( 'spacing.customPadding', name );

	return settings && supports.includes( 'padding' );
}

function useHasMargin( { name, supports } ) {
	const settings = useEditorFeature( 'spacing.customMargin', name );

	return settings && supports.includes( 'margin' );
}

function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

function useCustomUnits( { units, contextName } ) {
	const availableUnits = useEditorFeature( 'spacing.units', contextName );
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	return usedUnits.length === 0 ? false : usedUnits;
}

function filterValuesBySides( values, sides ) {
	if ( ! sides ) {
		// If no custom side configuration all sides are opted into by default.
		return values;
	}

	// Only include sides opted into within filtered values.
	const filteredValues = {};
	sides.forEach( ( side ) => ( filteredValues[ side ] = values[ side ] ) );

	return filteredValues;
}

export default function SpacingPanel( { context, getStyle, setStyle } ) {
	const { name } = context;
	const showPaddingControl = useHasPadding( context );
	const showMarginControl = useHasMargin( context );
	const units = useCustomUnits( { contextName: name, units: CSS_UNITS } );

	const paddingValues = getStyle( name, 'padding' );
	const paddingSides = useCustomSides( name, 'padding' );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setStyle( name, 'padding', padding );
	};

	const marginValues = getStyle( name, 'margin' );
	const marginSides = useCustomSides( name, 'margin' );

	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		setStyle( name, 'margin', margin );
	};

	return (
		<PanelBody title={ __( 'Spacing' ) }>
			{ showPaddingControl && (
				<BoxControl
					values={ paddingValues }
					onChange={ setPaddingValues }
					label={ __( 'Padding' ) }
					sides={ paddingSides }
					units={ units }
				/>
			) }
			{ showMarginControl && (
				<BoxControl
					values={ marginValues }
					onChange={ setMarginValues }
					label={ __( 'Margin' ) }
					sides={ marginSides }
					units={ units }
				/>
			) }
		</PanelBody>
	);
}
