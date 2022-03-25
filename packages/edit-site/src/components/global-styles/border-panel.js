/**
 * WordPress dependencies
 */
import { __experimentalBorderRadiusControl as BorderRadiusControl } from '@wordpress/block-editor';
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
import {
	getSupportedGlobalStylesPanels,
	useColorsPerOrigin,
	useSetting,
	useStyle,
} from './hooks';

export function useHasBorderPanel( name ) {
	const controls = [
		useHasBorderColorControl( name ),
		useHasBorderRadiusControl( name ),
		useHasBorderStyleControl( name ),
		useHasBorderWidthControl( name ),
	];

	return controls.some( Boolean );
}

function useHasBorderColorControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.color', name )[ 0 ] &&
		supports.includes( 'borderColor' )
	);
}

function useHasBorderRadiusControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.radius', name )[ 0 ] &&
		supports.includes( 'borderRadius' )
	);
}

function useHasBorderStyleControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.style', name )[ 0 ] &&
		supports.includes( 'borderStyle' )
	);
}

function useHasBorderWidthControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.width', name )[ 0 ] &&
		supports.includes( 'borderWidth' )
	);
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

export default function BorderPanel( { name } ) {
	// To better reflect if the user has customized a value we need to
	// ensure the style value being checked is from the `user` origin.
	const [ userBorderStyles ] = useStyle( 'border', name, 'user' );
	const [ border, setBorder ] = useStyle( 'border', name );
	const colors = useColorsPerOrigin( name );

	const showBorderColor = useHasBorderColorControl( name );
	const showBorderStyle = useHasBorderStyleControl( name );
	const showBorderWidth = useHasBorderWidthControl( name );

	// Border radius.
	const showBorderRadius = useHasBorderRadiusControl( name );
	const [ borderRadiusValues, setBorderRadius ] = useStyle(
		'border.radius',
		name
	);
	const hasBorderRadius = () => {
		const borderValues = userBorderStyles?.radius;
		if ( typeof borderValues === 'object' ) {
			return Object.entries( borderValues ).some( Boolean );
		}
		return !! borderValues;
	};

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: userBorderStyles.radius } );
		}

		setBorder( undefined );
	};

	const resetAll = useCallback( () => setBorder( undefined ), [ setBorder ] );
	const onBorderChange = useCallback(
		( newBorder ) => {
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
		},
		[ setBorder ]
	);

	return (
		<ToolsPanel label={ __( 'Border' ) } resetAll={ resetAll }>
			{ ( showBorderWidth || showBorderColor ) && (
				<ToolsPanelItem
					hasValue={ () => isDefinedBorder( userBorderStyles ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ true }
				>
					<BorderBoxControl
						colors={ colors }
						onChange={ onBorderChange }
						showStyle={ showBorderStyle }
						value={ border }
						popoverClassNames={ {
							linked:
								'edit-site-global-styles-sidebar__border-box-control__popover',
							top:
								'edit-site-global-styles-sidebar__border-box-control__popover-top',
							right:
								'edit-site-global-styles-sidebar__border-box-control__popover-right',
							bottom:
								'edit-site-global-styles-sidebar__border-box-control__popover-bottom',
							left:
								'edit-site-global-styles-sidebar__border-box-control__popover-left',
						} }
						__experimentalHasMultipleOrigins={ true }
						__experimentalIsRenderedInSidebar={ true }
					/>
				</ToolsPanelItem>
			) }
			{ showBorderRadius && (
				<ToolsPanelItem
					hasValue={ hasBorderRadius }
					label={ __( 'Radius' ) }
					onDeselect={ () => setBorderRadius( undefined ) }
					isShownByDefault={ true }
				>
					<BorderRadiusControl
						values={ borderRadiusValues }
						onChange={ ( value ) => {
							setBorderRadius( value || undefined );
						} }
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
