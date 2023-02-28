/**
 * WordPress dependencies
 */
import {
	__experimentalBorderBoxControl as BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import { getValueFromVariable } from './utils';

export function useHasBorderPanel( settings ) {
	const controls = [
		useHasBorderColorControl( settings ),
		useHasBorderRadiusControl( settings ),
		useHasBorderStyleControl( settings ),
		useHasBorderWidthControl( settings ),
	];

	return controls.some( Boolean );
}

function useHasBorderColorControl( settings ) {
	return settings?.border?.color;
}

function useHasBorderRadiusControl( settings ) {
	return settings?.border?.radius;
}

function useHasBorderStyleControl( settings ) {
	return settings?.border?.style;
}

function useHasBorderWidthControl( settings ) {
	return settings?.border?.width;
}

function applyFallbackStyle( border ) {
	if ( ! border ) {
		return border;
	}

	if ( ! border.style && ( border.color || border.width ) ) {
		return { ...border, style: 'solid' };
	}

	return border;
}

function applyAllFallbackStyles( border ) {
	if ( ! border ) {
		return border;
	}

	if ( hasSplitBorders( border ) ) {
		return {
			top: applyFallbackStyle( border.top ),
			right: applyFallbackStyle( border.right ),
			bottom: applyFallbackStyle( border.bottom ),
			left: applyFallbackStyle( border.left ),
		};
	}

	return applyFallbackStyle( border );
}

function BorderToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Border' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	borderStyle: true,
	borderRadius: true,
};

export default function BorderPanel( {
	as: Wrapper = BorderToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const border = inheritedValue?.border;
	const setBorder = ( newBorder ) =>
		onChange( { ...value, border: newBorder } );
	const colors = useColorsPerOrigin( settings );
	const showBorderColor = useHasBorderColorControl( settings );
	const showBorderStyle = useHasBorderStyleControl( settings );
	const showBorderWidth = useHasBorderWidthControl( settings );

	// Border radius.
	const showBorderRadius = useHasBorderRadiusControl( settings );
	const borderRadiusValues = decodeValue( border?.radius );
	const setBorderRadius = ( newBorderRadius ) =>
		setBorder( { ...border, radius: newBorderRadius } );
	const hasBorderRadius = () => {
		const borderValues = value?.border?.radius;
		if ( typeof borderValues === 'object' ) {
			return Object.entries( borderValues ).some( Boolean );
		}
		return !! borderValues;
	};

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: value?.border?.radius } );
		}

		setBorder( undefined );
	};

	const onBorderChange = ( newBorder ) => {
		// Ensure we have a visible border style when a border width or
		// color is being selected.
		const newBorderWithStyle = applyAllFallbackStyles( newBorder );

		// As we can't conditionally generate styles based on if other
		// style properties have been set we need to force split border
		// definitions for user set border styles. Border radius is derived
		// from the same property i.e. `border.radius` if it is a string
		// that is used. The longhand border radii styles are only generated
		// if that property is an object.
		//
		// For borders (color, style, and width) those are all properties on
		// the `border` style property. This means if the theme.json defined
		// split borders and the user condenses them into a flat border or
		// vice-versa we'd get both sets of styles which would conflict.
		const updatedBorder = ! hasSplitBorders( newBorderWithStyle )
			? {
					top: newBorderWithStyle,
					right: newBorderWithStyle,
					bottom: newBorderWithStyle,
					left: newBorderWithStyle,
			  }
			: {
					color: null,
					style: null,
					width: null,
					...newBorderWithStyle,
			  };

		// As radius is maintained separately to color, style, and width
		// maintain its value. Undefined values here will be cleaned when
		// global styles are saved.
		setBorder( { radius: border?.radius, ...updatedBorder } );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			border: undefined,
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ ( showBorderWidth || showBorderColor ) && (
				<ToolsPanelItem
					hasValue={ () => isDefinedBorder( value?.border ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ defaultControls.borderStyle }
				>
					<BorderBoxControl
						colors={ colors }
						enableAlpha={ true }
						enableStyle={ showBorderStyle }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						value={ border }
						__experimentalIsRenderedInSidebar={ true }
						size={ '__unstable-large' }
					/>
				</ToolsPanelItem>
			) }
			{ showBorderRadius && (
				<ToolsPanelItem
					hasValue={ hasBorderRadius }
					label={ __( 'Radius' ) }
					onDeselect={ () => setBorderRadius( undefined ) }
					isShownByDefault={ defaultControls.borderRadius }
				>
					<BorderRadiusControl
						values={ borderRadiusValues }
						onChange={ ( newValue ) => {
							setBorderRadius( newValue || undefined );
						} }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
