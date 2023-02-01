/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';

const hasShadowValue = ( attributes ) => {
	const { shadow, style } = attributes;
	return style?.shadow || !! shadow;
};

export function EffectsPanel( props ) {
	const { name, attributes, clientId, setAttributes } = props;
	// const { style } = attributes;
	// const { colors } = useMultipleOriginColorsAndGradients();

	const isShadowSupported = hasEffectsSupport( name );
	
	if ( !isShadowSupported ) {
		return null;
	}

	// const defaultBorderControls = getBlockSupport( props.name, [
	// 	BORDER_SUPPORT_KEY,
	// 	'__experimentalDefaultControls',
	// ] );

	// const showBorderByDefault =
	// 	defaultBorderControls?.color || defaultBorderControls?.width;

	// const onBorderChange = ( newBorder ) => {
	// 	// Filter out named colors and apply them to appropriate block
	// 	// attributes so that CSS classes can be used to apply those colors.
	// 	// e.g. has-primary-border-top-color.

	// 	let newBorderStyles = { ...newBorder };
	// 	let newBorderColor;

	// 	if ( hasSplitBorders( newBorder ) ) {
	// 		// For each side check if the side has a color value set
	// 		// If so, determine if it belongs to a named color, in which case
	// 		// we update the color property.
	// 		//
	// 		// This deliberately overwrites `newBorderStyles` to avoid mutating
	// 		// the passed object which causes problems otherwise.
	// 		newBorderStyles = {
	// 			top: { ...newBorder.top },
	// 			right: { ...newBorder.right },
	// 			bottom: { ...newBorder.bottom },
	// 			left: { ...newBorder.left },
	// 		};

	// 		borderSides.forEach( ( side ) => {
	// 			if ( newBorder[ side ]?.color ) {
	// 				const colorObject = getMultiOriginColor( {
	// 					colors,
	// 					customColor: newBorder[ side ]?.color,
	// 				} );

	// 				if ( colorObject.slug ) {
	// 					newBorderStyles[
	// 						side
	// 					].color = `var:preset|color|${ colorObject.slug }`;
	// 				}
	// 			}
	// 		} );
	// 	} else if ( newBorder?.color ) {
	// 		// We have a flat border configuration. Apply named color slug to
	// 		// `borderColor` attribute and clear color style property if found.
	// 		const customColor = newBorder?.color;
	// 		const colorObject = getMultiOriginColor( { colors, customColor } );

	// 		if ( colorObject.slug ) {
	// 			newBorderColor = colorObject.slug;
	// 			newBorderStyles.color = undefined;
	// 		}
	// 	}

	// 	// Ensure previous border radius styles are maintained and clean
	// 	// overall result for empty objects or properties.
	// 	const newStyle = cleanEmptyObject( {
	// 		...style,
	// 		border: { radius: style?.border?.radius, ...newBorderStyles },
	// 	} );

	// 	setAttributes( {
	// 		style: newStyle,
	// 		borderColor: newBorderColor,
	// 	} );
	// };

	// const hydratedBorder = getBorderObject( attributes, colors );

	return (
		<InspectorControls group="effects">
			{ ( isShadowSupported ) && (
				<ToolsPanelItem
					hasValue={ () =>  hasShadowValue(attributes) }
					label={ __( 'Shadow' ) }
					onDeselect={ () => {} } // resetBorder( props )
					isShownByDefault={ true } // showBorderByDefault
					resetAllFilter={ () => {} } // resetBorderFilter
					panelId={ clientId }
				>
					{/* <BorderBoxControl
						colors={ colors }
						enableAlpha={ true }
						enableStyle={ isStyleSupported }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						size="__unstable-large"
						value={ hydratedBorder }
						__experimentalIsRenderedInSidebar={ true }
					/> */}
                    <div>Shadow controls</div>
				</ToolsPanelItem>
			) }
			
		</InspectorControls>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Border feature to check support for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasEffectsSupport( blockName, feature = 'any' ) {
    return true;
	// if ( Platform.OS !== 'web' ) {
	// 	return false;
	// }

	// const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	// if ( support === true ) {
	// 	return true;
	// }

	// if ( feature === 'any' ) {
	// 	return !! (
	// 		support?.color ||
	// 		support?.radius ||
	// 		support?.width ||
	// 		support?.style
	// 	);
	// }

	// return !! support?.[ feature ];
}

const getShadowObject = ( attributes, colors ) => {
	const { shadow, style } = attributes;
	const { shadow: string } = style || {};

	// If we have a named color for a flat border. Fetch that color object and
	// apply that color's value to the color property within the style object.
	if ( borderColor ) {
		const { color } = getMultiOriginColor( {
			colors,
			namedColor: borderColor,
		} );

		return color ? { ...borderStyles, color } : borderStyles;
	}

	// Individual side border color slugs are stored within the border style
	// object. If we don't have a border styles object we have nothing further
	// to hydrate.
	if ( ! borderStyles ) {
		return borderStyles;
	}

	// If we have named colors for the individual side borders, retrieve their
	// related color objects and apply the real color values to the split
	// border objects.
	const hydratedBorderStyles = { ...borderStyles };
	borderSides.forEach( ( side ) => {
		const colorSlug = getColorSlugFromVariable(
			hydratedBorderStyles[ side ]?.color
		);
		if ( colorSlug ) {
			const { color } = getMultiOriginColor( {
				colors,
				namedColor: colorSlug,
			} );
			hydratedBorderStyles[ side ] = {
				...hydratedBorderStyles[ side ],
				color,
			};
		}
	} );

	return hydratedBorderStyles;
};