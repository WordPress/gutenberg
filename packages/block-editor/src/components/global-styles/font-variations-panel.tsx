import {
	RangeControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import type { ReactNode } from 'react';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

type FontVariationSettings = Record< string, number >;

type Style = {
	typography?: {
		fontFamily?: string;
		fontVariationSettings?: FontVariationSettings;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
};

type FontFaceAxis = {
	tag: string;
	name?: string;
	min: number;
	default?: number;
	max: number;
};

type FontFamily = {
	slug: string;
	fontFamily: string;
	fontFace?: FontFace[];
};

type FontFace = {
	fontStyle?: string;
	fontWeight?: string | number;
	axes?: FontFaceAxis[];
};

export type FontAppearance = {
	fontStyle?: unknown;
	fontWeight?: unknown;
};

type Settings = {
	typography?: {
		fontFamilies?: Record< string, FontFamily[] | undefined >;
		fontVariations?: boolean;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
};

export type FontVariationAxis = {
	tag: string;
	name?: string;
	min: number;
	max: number;
	default: number;
};

/**
 * Axes with a CSS property of their own. They are set through font weight,
 * width and style, not through `font-variation-settings`.
 */
const REGISTERED_AXES_WITH_PROPERTIES = [ 'wght', 'wdth', 'slnt', 'ital' ];

const EMPTY_AXES: FontVariationAxis[] = [];

/**
 * Returns the slug of the font family a style value refers to.
 *
 * @param fontFamilyValue Font family from block attributes or Global Styles.
 * @param fontFamilies    Font families from all origins.
 * @return The font family slug, if it can be found.
 */
function getFontFamilySlug(
	fontFamilyValue: unknown,
	fontFamilies: FontFamily[]
): string | undefined {
	if ( typeof fontFamilyValue !== 'string' || ! fontFamilyValue ) {
		return undefined;
	}
	// Block attributes use the `var:preset|font-family|slug` format.
	if ( fontFamilyValue.startsWith( 'var:preset|font-family|' ) ) {
		return fontFamilyValue.substring( 'var:preset|font-family|'.length );
	}
	// Global Styles use the `var(--wp--preset--font-family--slug)` format.
	const cssVarMatch = fontFamilyValue.match(
		/^var\(--wp--preset--font-family--([^)]+)\)$/
	);
	if ( cssVarMatch ) {
		return cssVarMatch[ 1 ];
	}
	return fontFamilies.find(
		( family ) => family.fontFamily === fontFamilyValue
	)?.slug;
}

/**
 * Parses a font weight value into a number, `400` when it can't be read.
 *
 * @param value A font weight, e.g. `700`, `"700"` or `"bold"`.
 * @return The numeric weight.
 */
function parseFontWeight( value: unknown ): number {
	if ( value === 'bold' ) {
		return 700;
	}
	const weight = parseFloat( String( value ) );
	return Number.isFinite( weight ) ? weight : 400;
}

/**
 * Returns the faces the browser can use for a font style and weight: those
 * with the same style whose weight, or weight range, includes it. When none
 * match, the browser picks the nearest face, so all faces are returned.
 *
 * @param faces      The family's faces.
 * @param appearance The font style and weight in use.
 * @return The candidate faces.
 */
function getCandidateFaces(
	faces: FontFace[],
	appearance: FontAppearance | undefined
): FontFace[] {
	const style =
		typeof appearance?.fontStyle === 'string' && appearance.fontStyle
			? appearance.fontStyle
			: 'normal';
	const weight = parseFontWeight( appearance?.fontWeight ?? 400 );
	const matching = faces.filter( ( face ) => {
		if ( ( face.fontStyle || 'normal' ) !== style ) {
			return false;
		}
		const [ min, max = min ] = String( face.fontWeight ?? 400 )
			.trim()
			.split( /\s+/ )
			.map( parseFontWeight );
		return weight >= min && weight <= max;
	} );
	return matching.length ? matching : faces;
}

/**
 * Returns the axes a user can set for a font family: the ones the faces in use
 * declare, over the range all of them allow, once the theme has turned the panel
 * on with `settings.typography.fontVariations`.
 *
 * Axes that have a CSS property of their own are left out, because they are set
 * through the typography controls instead. What remains is what only
 * `font-variation-settings` can reach, and the font is the authority on its
 * range: a theme decides whether to offer this editing at all, not how far each
 * axis may travel.
 *
 * @param settings        Block or Global Styles settings.
 * @param fontFamilyValue Font family from block attributes or Global Styles.
 * @param appearance      Font style and weight, which select the faces.
 * @return The axes to show, in the order the faces declare them.
 */
export function getFontVariationAxes(
	settings: Settings | undefined,
	fontFamilyValue: unknown,
	appearance?: FontAppearance
): FontVariationAxis[] {
	if ( ! settings?.typography?.fontVariations ) {
		return EMPTY_AXES;
	}
	const fontFamiliesByOrigin = settings?.typography?.fontFamilies;
	const fontFamilies = [ 'default', 'theme', 'custom' ].flatMap(
		( origin ) => fontFamiliesByOrigin?.[ origin ] ?? []
	);
	const slug = getFontFamilySlug( fontFamilyValue, fontFamilies );
	if ( ! slug ) {
		return EMPTY_AXES;
	}

	// An axis is offered only if every face that may render the text has it,
	// and only within the range all of them support.
	const family = fontFamilies.find( ( { slug: s } ) => s === slug );
	const faces = getCandidateFaces( family?.fontFace ?? [], appearance );
	const capabilities = new Map< string, FontFaceAxis >();
	faces.forEach( ( face, index ) => {
		const faceAxes = new Map(
			( face?.axes ?? [] ).map( ( axis ) => [ axis.tag, axis ] )
		);
		if ( index === 0 ) {
			faceAxes.forEach( ( axis, tag ) => capabilities.set( tag, axis ) );
			return;
		}
		capabilities.forEach( ( known, tag ) => {
			const axis = faceAxes.get( tag );
			if ( ! axis ) {
				capabilities.delete( tag );
				return;
			}
			capabilities.set( tag, {
				...known,
				min: Math.max( known.min, axis.min ),
				max: Math.min( known.max, axis.max ),
			} );
		} );
	} );

	return [ ...capabilities.values() ].flatMap( ( axis ) => {
		if ( REGISTERED_AXES_WITH_PROPERTIES.includes( axis.tag ) ) {
			return [];
		}
		const { min, max } = axis;
		if ( ! ( min < max ) ) {
			return [];
		}
		return [
			{
				tag: axis.tag,
				name: axis.name,
				min,
				max,
				default: Math.min( Math.max( axis.default ?? min, min ), max ),
			},
		];
	} );
}

/**
 * Returns a label for an axis. Theme-provided names come first; a few
 * common axes have a translated fallback, the rest show their tag.
 *
 * @param axis The axis.
 * @return The label.
 */
function getAxisLabel( axis: FontVariationAxis ): string {
	if ( axis.name ) {
		return axis.name;
	}
	switch ( axis.tag ) {
		case 'opsz':
			return __( 'Optical size' );
		case 'GRAD':
			return __( 'Grade' );
		default:
			return axis.tag;
	}
}

export function useHasFontVariationsPanel(
	settings: Settings | undefined,
	fontFamilyValue: unknown
): boolean {
	return useMemo(
		() => getFontVariationAxes( settings, fontFamilyValue ).length > 0,
		[ settings, fontFamilyValue ]
	);
}

interface WrapperProps {
	resetAllFilter: ( style: Style ) => Style;
	value: Style;
	onChange: ( style: Style ) => void;
	panelId?: string;
	children: ReactNode;
}

function FontVariationsToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
}: WrapperProps ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	return (
		<ToolsPanel
			label={ __( 'Font variations' ) }
			resetAll={ () => onChange( resetAllFilter( value ) ) }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

interface FontVariationsPanelProps {
	as?: ( props: WrapperProps ) => ReactNode;
	value: Style;
	onChange: ( style: Style ) => void;
	inheritedValue?: Style;
	settings: Settings | undefined;
	panelId?: string;
}

/**
 * Controls for the variable font axes a theme exposes for the selected font
 * family. Values are stored in `typography.fontVariationSettings`, an object
 * keyed by axis tag.
 *
 * @param props                The component props.
 * @param props.as             Wrapper component.
 * @param props.value          Style value.
 * @param props.onChange       Called with the updated style value.
 * @param props.inheritedValue Style value including inherited styles.
 * @param props.settings       Block or Global Styles settings.
 * @param props.panelId        ToolsPanel id.
 */
export default function FontVariationsPanel( {
	as: Wrapper = FontVariationsToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
}: FontVariationsPanelProps ) {
	const fontFamily =
		value?.typography?.fontFamily ?? inheritedValue?.typography?.fontFamily;
	const fontStyle =
		value?.typography?.fontStyle ?? inheritedValue?.typography?.fontStyle;
	const fontWeight =
		value?.typography?.fontWeight ?? inheritedValue?.typography?.fontWeight;
	const axes = useMemo(
		() =>
			getFontVariationAxes( settings, fontFamily, {
				fontStyle,
				fontWeight,
			} ),
		[ settings, fontFamily, fontStyle, fontWeight ]
	);

	const resetAllFilter = useCallback(
		( previousValue: Style ) =>
			setImmutably(
				previousValue,
				[ 'typography', 'fontVariationSettings' ],
				undefined
			),
		[]
	);

	if ( ! axes.length ) {
		return null;
	}

	const variations = value?.typography?.fontVariationSettings;
	const inheritedVariations =
		inheritedValue?.typography?.fontVariationSettings;

	const setAxisValue = ( tag: string, axisValue: number | undefined ) => {
		const next: FontVariationSettings = { ...variations };
		if ( axisValue === undefined || Number.isNaN( axisValue ) ) {
			delete next[ tag ];
		} else {
			next[ tag ] = axisValue;
		}
		onChange(
			setImmutably(
				value,
				[ 'typography', 'fontVariationSettings' ],
				Object.keys( next ).length ? next : undefined
			)
		);
	};

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ axes.map( ( axis ) => {
				const label = getAxisLabel( axis );
				return (
					<ToolsPanelItem
						key={ axis.tag }
						label={ label }
						hasValue={ () =>
							variations?.[ axis.tag ] !== undefined
						}
						onDeselect={ () => setAxisValue( axis.tag, undefined ) }
						isShownByDefault
						panelId={ panelId }
					>
						<RangeControl
							label={ label }
							min={ axis.min }
							max={ axis.max }
							step={ axis.max - axis.min <= 10 ? 0.1 : 1 }
							value={ variations?.[ axis.tag ] }
							initialPosition={
								inheritedVariations?.[ axis.tag ] ??
								axis.default
							}
							withInputField
							onChange={ ( newValue ) =>
								setAxisValue( axis.tag, newValue )
							}
						/>
					</ToolsPanelItem>
				);
			} ) }
		</Wrapper>
	);
}
