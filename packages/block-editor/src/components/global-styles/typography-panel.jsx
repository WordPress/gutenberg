import {
	FontSizePicker,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	Notice,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import FontFamilyControl from '../font-family';
import FontAppearanceControl from '../font-appearance-control';
import VariableFontAppearanceControl from '../variable-font-appearance-control';
import FontWidthControl from '../font-width-control';
import LineHeightControl from '../line-height-control';
import LetterSpacingControl from '../letter-spacing-control';
import TextAlignmentControl from '../text-alignment-control';
import TextTransformControl from '../text-transform-control';
import TextDecorationControl from '../text-decoration-control';
import TextIndentControl from '../text-indent-control';
import WritingModeControl from '../writing-mode-control';
import { TextShadowPopover } from './text-shadow-panel';
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import { useHasTextPanel } from './color-panel';
import { useColorGradientSettings } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import {
	extractPresetSlug,
	encodeColorValueWithPalette,
} from '../../utils/color-values';
import {
	getMergedFontFamiliesAndFontFamilyFaces,
	findNearestStyleAndWeight,
} from './typography-utils';
import { getFontStylesAndWeights } from '../../utils/get-font-styles-and-weights';
import { getFontWeightRange } from '../../utils/get-font-weight-range';
import { getFontStretchRange } from '../../utils/get-font-stretch-range';
import { parseFontStretchValue } from '../../utils/parse-font-stretch';
import {
	getInheritanceProps,
	InheritanceToolsPanelItem,
	isGlobalStylesInheritanceIndicatorUIEnabled,
} from './inheritance';

const MIN_TEXT_COLUMNS = 1;
const MAX_TEXT_COLUMNS = 6;

/**
 * Whether a link color should follow a text color change.
 *
 * A link color tracks the text color (e.g. a Button's) unless it was set
 * deliberately. Raw preset refs are compared rather than decoded hex, since
 * distinct slots can share a hex (`dark-background`/`dark-text` both `#000`).
 *
 * @param {Object} value          Local block styles.
 * @param {Object} inheritedValue Styles inherited from Global Styles.
 * @return {boolean} Whether to sync the link color to the text color.
 */
function shouldSyncLinkColor( value, inheritedValue ) {
	const localLinkColor = value?.elements?.link?.color?.text;
	// A local link color keeps tracking only while it matches the text color;
	// once it differs it was set deliberately and is left alone.
	if ( localLinkColor !== undefined ) {
		return localLinkColor === value?.color?.text;
	}
	// With none set, defer to the inherited values.
	const inheritedLinkColor = inheritedValue?.elements?.link?.color?.text;
	return (
		inheritedLinkColor === undefined ||
		inheritedValue?.color?.text === inheritedLinkColor
	);
}

export function useHasTypographyPanel( settings ) {
	const hasFontFamily = useHasFontFamilyControl( settings );
	const hasLineHeight = useHasLineHeightControl( settings );
	const hasFontStyle = useHasFontStyleControl( settings );
	const hasFontWeight = useHasFontWeightControl( settings );
	const hasFontStretch = useHasFontStretchControl( settings );
	const hasLetterSpacing = useHasLetterSpacingControl( settings );
	const hasTextAlign = useHasTextAlignmentControl( settings );
	const hasTextTransform = useHasTextTransformControl( settings );
	const hasTextDecoration = useHasTextDecorationControl( settings );
	const hasTextIndent = useHasTextIndentControl( settings );
	const hasWritingMode = useHasWritingModeControl( settings );
	const hasTextColumns = useHasTextColumnsControl( settings );
	const hasFontSize = useHasFontSizeControl( settings );
	const hasTextColor = useHasTextPanel( settings );
	const hasTextShadow = useHasTextShadowControl( settings );

	return (
		hasFontFamily ||
		hasLineHeight ||
		hasFontStyle ||
		hasFontWeight ||
		hasFontStretch ||
		hasLetterSpacing ||
		hasTextAlign ||
		hasTextTransform ||
		hasFontSize ||
		hasTextDecoration ||
		hasTextIndent ||
		hasWritingMode ||
		hasTextColumns ||
		hasTextColor ||
		hasTextShadow
	);
}

function useHasFontSizeControl( settings ) {
	return (
		( settings?.typography?.defaultFontSizes !== false &&
			settings?.typography?.fontSizes?.default?.length ) ||
		settings?.typography?.fontSizes?.theme?.length ||
		settings?.typography?.fontSizes?.custom?.length ||
		settings?.typography?.customFontSize
	);
}

function useHasFontFamilyControl( settings ) {
	return [ 'default', 'theme', 'custom' ].some(
		( key ) => settings?.typography?.fontFamilies?.[ key ]?.length
	);
}

function useHasLineHeightControl( settings ) {
	return settings?.typography?.lineHeight;
}

/*
 * One axis, one panel item. The settings behind them were always separate;
 * only the item was shared, which made its label change to say which axis had
 * survived, and tied one reset and one default visibility to two axes.
 */
function useHasFontStyleControl( settings ) {
	return !! settings?.typography?.fontStyle;
}

function useHasFontWeightControl( settings ) {
	return !! settings?.typography?.fontWeight;
}

function useHasFontStretchControl( settings ) {
	return !! settings?.typography?.fontStretch;
}

/**
 * Whether the family in use can be drawn at more than one width.
 *
 * A setting says the site allows this editing; it does not say the font can do
 * it. Unlike a weight or a slant, a width the font does not have is never
 * synthesised, so offering the control for a family with one width would offer
 * nothing. A variable face declares a range, and a static family declares a
 * width per face.
 *
 * @param {Array} fontFamilyFaces The faces of the family in use.
 * @return {boolean} Whether there is more than one width to choose from.
 */
function hasFontStretchCapability( fontFamilyFaces ) {
	if ( getFontStretchRange( fontFamilyFaces ) ) {
		return true;
	}
	const declared = new Set();
	fontFamilyFaces?.forEach( ( { fontStretch } ) => {
		if ( 'string' !== typeof fontStretch ) {
			return;
		}
		const width = parseFontStretchValue( fontStretch );
		if ( width !== undefined ) {
			declared.add( width );
		}
	} );
	return declared.size > 1;
}

/**
 * Reads whether an axis is shown by default, honouring `fontAppearance` as the
 * name the style and weight items shared before they were separate. A default
 * named for the axis itself wins, so a caller can keep the old name and still
 * say something new about one of them.
 *
 * Width was never part of that name, so it is shown only when it is asked for
 * by its own key.
 *
 * @param {Object} defaultControls The panel's default controls.
 * @param {string} axis            The axis key.
 * @return {boolean|undefined} Whether the axis is shown by default.
 */
const AXES_THE_APPEARANCE_NAME_COVERED = [ 'fontStyle', 'fontWeight' ];

function isAxisShownByDefault( defaultControls, axis ) {
	if ( defaultControls[ axis ] !== undefined ) {
		return defaultControls[ axis ];
	}
	return AXES_THE_APPEARANCE_NAME_COVERED.includes( axis )
		? defaultControls.fontAppearance
		: undefined;
}

function useHasLetterSpacingControl( settings ) {
	return settings?.typography?.letterSpacing;
}

function useHasTextTransformControl( settings ) {
	return settings?.typography?.textTransform;
}

function useHasTextAlignmentControl( settings ) {
	return settings?.typography?.textAlign;
}

function useHasTextDecorationControl( settings ) {
	return settings?.typography?.textDecoration;
}

function useHasWritingModeControl( settings ) {
	return settings?.typography?.writingMode;
}

function useHasTextColumnsControl( settings ) {
	return settings?.typography?.textColumns;
}

function useHasTextIndentControl( settings ) {
	return settings?.typography?.textIndent;
}

function useHasTextShadowControl( settings ) {
	return settings?.typography?.textShadow;
}

/**
 * Concatenate all the font sizes into a single list for the font size picker.
 *
 * @param {Object} settings The global styles settings.
 *
 * @return {Array} The merged font sizes.
 */
function getMergedFontSizes( settings ) {
	const fontSizes = settings?.typography?.fontSizes;
	const defaultFontSizesEnabled = !! settings?.typography?.defaultFontSizes;
	return [
		...( fontSizes?.custom ?? [] ),
		...( fontSizes?.theme ?? [] ),
		...( defaultFontSizesEnabled ? ( fontSizes?.default ?? [] ) : [] ),
	];
}

export function TypographyToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Typography' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			__experimentalFirstVisibleItemClass="first"
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	textColor: true,
	fontFamily: true,
	fontSize: true,
	fontAppearance: true,
	lineHeight: true,
	letterSpacing: true,
	textAlign: true,
	textTransform: true,
	textDecoration: true,
	textIndent: true,
	writingMode: true,
	textColumns: true,
	textShadow: true,
};

const EMPTY_VALUES = [ undefined, null, '' ];

function hasValue( value ) {
	return ! EMPTY_VALUES.includes( value );
}

/**
 * Extracts the numeric quantity from a raw CSS value so it can be used as a
 * unit-control placeholder. The control's unit selector already reflects the
 * inherited unit, so the placeholder must contain only the number (e.g.
 * `1.5em` -> `1.5`) rather than the full unit string.
 *
 * @param {string|number|undefined} rawValue Inherited value to parse.
 * @return {number|undefined} The numeric quantity, or `undefined` when absent.
 */
function getNumericPlaceholder( rawValue ) {
	if ( ! hasValue( rawValue ) ) {
		return undefined;
	}
	const [ quantity ] = parseQuantityAndUnitFromRawValue( rawValue );
	return quantity;
}

export default function TypographyPanel( {
	as: Wrapper = TypographyToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	isGlobalStyles = false,
	showInheritanceLabelIndicators = isGlobalStylesInheritanceIndicatorUIEnabled(),
	contrastWarning,
} ) {
	const { colors, allColors, areCustomSolidsEnabled, decodeValue } =
		useColorGradientSettings( settings );
	// Always keep the layout className (e.g. `single-column`); only the
	// inheritance treatment is gated on `showInheritanceLabelIndicators`.
	const inheritanceProps = ( isInherited, hasLocalOverride, className ) =>
		getInheritanceProps(
			showInheritanceLabelIndicators && isInherited,
			showInheritanceLabelIndicators && hasLocalOverride,
			className
		);

	// Text color. Writes to `color.text` (unchanged storage path). The
	// control is rendered here instead of the Color panel because text
	// color is a typographic concern.
	const hasTextColorEnabled = useHasTextPanel( settings );
	const textColor = decodeValue( inheritedValue?.color?.text );
	const userTextColor = decodeValue( value?.color?.text );
	const hasTextColorValue = () => !! value?.color?.text;
	const setTextColor = ( newColor, newSlug ) => {
		const encoded = encodeColorValueWithPalette(
			allColors,
			newColor,
			newSlug
		);
		let changedObject = setImmutably( value, [ 'color', 'text' ], encoded );
		if ( shouldSyncLinkColor( value, inheritedValue ) ) {
			changedObject = setImmutably(
				changedObject,
				[ 'elements', 'link', 'color', 'text' ],
				encoded
			);
		}
		onChange( changedObject );
	};
	const resetTextColor = () => setTextColor( undefined );

	// Font Family
	const hasFontFamilyEnabled = useHasFontFamilyControl( settings );
	// Render the local value when set, otherwise the inherited value
	// as the at-rest preselection. The placeholder boolean is computed
	// from `value` directly (not from the merged `fontFamily`) so a
	// locally-set value never trips the at-rest visual treatment, even
	// when it equals the inherited value.
	const inheritedFontFamily = decodeValue(
		inheritedValue?.typography?.fontFamily
	);
	const fontFamily =
		decodeValue( value?.typography?.fontFamily ) ?? inheritedFontFamily;
	const isFontFamilyPlaceholder =
		! hasValue( value?.typography?.fontFamily ) &&
		hasValue( inheritedFontFamily );
	const { fontFamilies, fontFamilyFaces } = useMemo( () => {
		return getMergedFontFamiliesAndFontFamilyFaces( settings, fontFamily );
	}, [ settings, fontFamily ] );

	const setFontFamily = ( newValue ) => {
		const slug = fontFamilies?.find(
			( { fontFamily: f } ) => f === newValue
		)?.slug;
		const nextFontFamily = slug
			? `var:preset|font-family|${ slug }`
			: newValue;
		let updatedValue = setImmutably(
			value,
			[ 'typography', 'fontFamily' ],
			hasValue( nextFontFamily ) ? nextFontFamily : undefined
		);

		// Check if current font style/weight are available in the new font family.
		const newFontFamilyFaces =
			fontFamilies?.find( ( { fontFamily: f } ) => f === newValue )
				?.fontFace ?? [];
		const { fontStyles, fontWeights } =
			getFontStylesAndWeights( newFontFamilyFaces );
		const hasFontStyle = fontStyles?.some(
			( { value: fs } ) => fs === fontStyle
		);
		// A variable font can draw any weight in its range, not only the
		// hundreds listed as presets.
		const newFontWeightRange = getFontWeightRange( newFontFamilyFaces );
		const numericFontWeight = Number( fontWeight );
		const hasFontWeight =
			fontWeights?.some(
				( { value: fw } ) => fw?.toString() === fontWeight?.toString()
			) ||
			( !! newFontWeightRange &&
				hasValue( fontWeight ) &&
				numericFontWeight >= newFontWeightRange.min &&
				numericFontWeight <= newFontWeightRange.max );

		// Find the nearest available font style/weight if not available.
		if ( ! hasFontStyle || ! hasFontWeight ) {
			const { nearestFontStyle, nearestFontWeight } =
				findNearestStyleAndWeight(
					newFontFamilyFaces,
					fontStyle,
					fontWeight
				);
			if ( nearestFontStyle || nearestFontWeight ) {
				// Update to the nearest available font style/weight in the new font family.
				updatedValue = {
					...updatedValue,
					typography: {
						...updatedValue?.typography,
						fontStyle: hasValue( nearestFontStyle )
							? nearestFontStyle
							: undefined,
						fontWeight: hasValue( nearestFontWeight )
							? nearestFontWeight
							: undefined,
					},
				};
			} else if ( fontStyle || fontWeight ) {
				// Reset if no available styles/weights found.
				updatedValue = {
					...updatedValue,
					typography: {
						...updatedValue?.typography,
						fontStyle: undefined,
						fontWeight: undefined,
					},
				};
			}
		}

		onChange( updatedValue );
	};
	const hasFontFamily = () => hasValue( value?.typography?.fontFamily );
	const resetFontFamily = () => setFontFamily( undefined );

	// Font Size
	const hasFontSizeEnabled = useHasFontSizeControl( settings );
	const disableCustomFontSizes = ! settings?.typography?.customFontSize;
	const mergedFontSizes = getMergedFontSizes( settings );

	// Local-then-inherited resolution for the rendered value. The slug
	// extraction reads the same composite raw value so an inherited
	// preset preselects its chip at rest while a local literal value
	// renders as a literal in the custom-size input.
	const rawLocalFontSize = value?.typography?.fontSize;
	const rawInheritedFontSize = inheritedValue?.typography?.fontSize;
	const rawFontSizeForDisplay = rawLocalFontSize ?? rawInheritedFontSize;
	const fontSize = decodeValue( rawFontSizeForDisplay );
	const inheritedFontSizeDecoded = decodeValue( rawInheritedFontSize );
	const isFontSizePlaceholder =
		! hasValue( rawLocalFontSize ) && hasValue( rawInheritedFontSize );

	// Extract the slug from the CSS custom property if it exists.
	const extractSlug = ( rawValue ) => {
		if ( ! rawValue || typeof rawValue !== 'string' ) {
			return undefined;
		}
		// Block supports use `var:preset` format.
		if ( rawValue.startsWith( 'var:preset|font-size|' ) ) {
			return rawValue.replace( 'var:preset|font-size|', '' );
		}
		// Global styles data uses `var(--wp--preset)` format.
		const cssVarMatch = rawValue.match(
			/^var\(--wp--preset--font-size--([^)]+)\)$/
		);
		if ( cssVarMatch ) {
			return cssVarMatch[ 1 ];
		}
		return undefined;
	};
	const currentFontSizeSlug = extractSlug( rawFontSizeForDisplay );
	const inheritedFontSizeSlug = extractSlug( rawInheritedFontSize );

	const setFontSize = ( newValue, metadata ) => {
		const actualValue = !! metadata?.slug
			? `var:preset|font-size|${ metadata?.slug }`
			: newValue;

		onChange(
			setImmutably(
				value,
				[ 'typography', 'fontSize' ],
				hasValue( actualValue ) ? actualValue : undefined
			)
		);
	};
	// Display-without-commit interceptor: at-rest, the inner
	// `FontSizePickerToggleGroup` fires `onChange( undefined )` when the
	// user activates the already-preselected (inherited) chip. Treat
	// that as the user's "accept this inherited value" affordance and
	// commit the inherited value to local. Once committed (no longer
	// at-rest), the same `undefined` payload represents a normal
	// deselect, so we let it pass through unchanged. The custom-size
	// input does not emit `undefined` on focus or activation, so this
	// hook is correctly scoped to the ToggleGroup activation path.
	const setFontSizeWithInheritedCommit = ( newValue, metadata ) => {
		if ( isFontSizePlaceholder && newValue === undefined && ! metadata ) {
			if ( inheritedFontSizeSlug ) {
				setFontSize( undefined, { slug: inheritedFontSizeSlug } );
			} else {
				setFontSize( inheritedFontSizeDecoded );
			}
			return;
		}
		setFontSize( newValue, metadata );
	};
	const hasFontSize = () => hasValue( value?.typography?.fontSize );
	const resetFontSize = () => setFontSize( undefined );

	// Style, Weight and Width
	const hasFontStyleControl = useHasFontStyleControl( settings );
	const hasFontWeightControl = useHasFontWeightControl( settings );
	// The setting allows the control; the font decides whether it has
	// anything to offer.
	const hasFontStretchControl =
		useHasFontStretchControl( settings ) &&
		hasFontStretchCapability( fontFamilyFaces );
	// A family with a weight range is variable: the weight takes any value in
	// the range rather than one of fixed style and weight combinations.
	const isVariableFont = useMemo(
		() => !! getFontWeightRange( fontFamilyFaces ),
		[ fontFamilyFaces ]
	);

	// Each axis reads its own local value, its own inherited value, and so
	// decides its own placeholder state.
	const inheritedFontStyle = decodeValue(
		inheritedValue?.typography?.fontStyle
	);
	const inheritedFontWeight = decodeValue(
		inheritedValue?.typography?.fontWeight
	);
	const inheritedFontStretch = decodeValue(
		inheritedValue?.typography?.fontStretch
	);
	const fontStyle =
		decodeValue( value?.typography?.fontStyle ) ?? inheritedFontStyle;
	const fontWeight =
		decodeValue( value?.typography?.fontWeight ) ?? inheritedFontWeight;
	const fontStretch =
		decodeValue( value?.typography?.fontStretch ) ?? inheritedFontStretch;
	const isFontStylePlaceholder =
		! hasValue( value?.typography?.fontStyle ) &&
		hasValue( inheritedFontStyle );
	const isFontWeightPlaceholder =
		! hasValue( value?.typography?.fontWeight ) &&
		hasValue( inheritedFontWeight );
	const isFontStretchPlaceholder =
		! hasValue( value?.typography?.fontStretch ) &&
		hasValue( inheritedFontStretch );

	const setAxis = useCallback(
		( axis, next ) => {
			onChange( {
				...value,
				typography: {
					...value?.typography,
					[ axis ]: hasValue( next ) ? next : undefined,
				},
			} );
		},
		[ onChange, value ]
	);

	/*
	 * Display-without-commit interceptor: when an axis is at rest, showing an
	 * inherited value with no local one, choosing the option already displayed
	 * would otherwise change nothing. Treat that as the user accepting the
	 * inherited value and write it locally.
	 */
	const setAxisWithInheritedCommit = useCallback(
		( axis, next, displayed, isPlaceholder ) => {
			if ( isPlaceholder && next === displayed ) {
				setAxis( axis, displayed );
				return;
			}
			if ( next !== displayed ) {
				setAxis( axis, next );
			}
		},
		[ setAxis ]
	);

	const setFontStyle = useCallback(
		( next ) =>
			setAxisWithInheritedCommit(
				'fontStyle',
				next,
				fontStyle,
				isFontStylePlaceholder
			),
		[ setAxisWithInheritedCommit, fontStyle, isFontStylePlaceholder ]
	);
	const setFontWeight = useCallback(
		( next ) =>
			setAxisWithInheritedCommit(
				'fontWeight',
				next,
				fontWeight,
				isFontWeightPlaceholder
			),
		[ setAxisWithInheritedCommit, fontWeight, isFontWeightPlaceholder ]
	);
	const setFontStretch = useCallback(
		( next ) =>
			setAxisWithInheritedCommit(
				'fontStretch',
				next,
				fontStretch,
				isFontStretchPlaceholder
			),
		[ setAxisWithInheritedCommit, fontStretch, isFontStretchPlaceholder ]
	);

	const hasFontStyle = () => hasValue( value?.typography?.fontStyle );
	const hasFontWeight = () => hasValue( value?.typography?.fontWeight );
	const hasFontStretch = () => hasValue( value?.typography?.fontStretch );
	const resetFontStyle = useCallback(
		() => setAxis( 'fontStyle', undefined ),
		[ setAxis ]
	);
	const resetFontWeight = useCallback(
		() => setAxis( 'fontWeight', undefined ),
		[ setAxis ]
	);
	const resetFontStretch = useCallback(
		() => setAxis( 'fontStretch', undefined ),
		[ setAxis ]
	);

	// Line Height
	const hasLineHeightEnabled = useHasLineHeightControl( settings );
	const localLineHeight = decodeValue( value?.typography?.lineHeight );
	const inheritedLineHeight = decodeValue(
		inheritedValue?.typography?.lineHeight
	);
	const isLineHeightPlaceholder =
		! hasValue( value?.typography?.lineHeight ) &&
		hasValue( inheritedLineHeight );
	const setLineHeight = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'lineHeight' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const hasLineHeight = () => hasValue( value?.typography?.lineHeight );
	const resetLineHeight = () => setLineHeight( undefined );

	// Letter Spacing
	const hasLetterSpacingControl = useHasLetterSpacingControl( settings );
	const localLetterSpacing = decodeValue( value?.typography?.letterSpacing );
	const inheritedLetterSpacing = decodeValue(
		inheritedValue?.typography?.letterSpacing
	);
	const isLetterSpacingPlaceholder =
		! hasValue( value?.typography?.letterSpacing ) &&
		hasValue( inheritedLetterSpacing );
	const setLetterSpacing = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'letterSpacing' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const hasLetterSpacing = () => hasValue( value?.typography?.letterSpacing );
	const resetLetterSpacing = () => setLetterSpacing( undefined );

	// Text Indent
	const hasTextIndentControl = useHasTextIndentControl( settings );
	const localTextIndent = decodeValue( value?.typography?.textIndent );
	const inheritedTextIndent = decodeValue(
		inheritedValue?.typography?.textIndent
	);
	const isTextIndentPlaceholder =
		! hasValue( value?.typography?.textIndent ) &&
		hasValue( inheritedTextIndent );

	// Get the setting value - can be 'subsequent' (default), 'all', or false.
	// The setting determines which CSS selector is used for the text-indent style.
	const textIndentSetting = settings?.typography?.textIndent ?? 'subsequent';
	const isTextIndentAll = textIndentSetting === 'all';

	const setTextIndentValue = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textIndent' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};

	const onToggleTextIndentAll = ( newValue ) => {
		// Toggle between 'all' and 'subsequent' for the setting.
		// Include the settings change so it can be handled atomically by the parent.
		onChange( {
			...value,
			settings: {
				typography: {
					textIndent: newValue ? 'all' : 'subsequent',
				},
			},
		} );
	};

	const hasTextIndent = () => hasValue( value?.typography?.textIndent );
	const resetTextIndent = () => {
		onChange(
			setImmutably( value, [ 'typography', 'textIndent' ], undefined )
		);
	};
	const textIndentHelp = isTextIndentAll
		? __( 'Indents the first line of all paragraphs.' )
		: __( 'Indents the first line of each paragraph after the first one.' );

	// Text Columns
	const hasTextColumnsControl = useHasTextColumnsControl( settings );
	const localTextColumns = decodeValue( value?.typography?.textColumns );
	const inheritedTextColumns = decodeValue(
		inheritedValue?.typography?.textColumns
	);
	const isTextColumnsPlaceholder =
		! hasValue( value?.typography?.textColumns ) &&
		hasValue( inheritedTextColumns );
	const setTextColumns = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textColumns' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const hasTextColumns = () => hasValue( value?.typography?.textColumns );
	const resetTextColumns = () => setTextColumns( undefined );

	// Text Transform
	const hasTextTransformControl = useHasTextTransformControl( settings );
	const inheritedTextTransform = decodeValue(
		inheritedValue?.typography?.textTransform
	);
	const textTransform =
		decodeValue( value?.typography?.textTransform ) ??
		inheritedTextTransform;
	const isTextTransformPlaceholder =
		! hasValue( value?.typography?.textTransform ) &&
		hasValue( inheritedTextTransform );
	const setTextTransform = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textTransform' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	// Display-without-commit interceptor: when at-rest, the inner
	// `ToggleGroupControl` fires `onChange( undefined )` if the user
	// activates the already-preselected (inherited) option. We treat
	// that activation as the user's "accept this inherited value"
	// affordance and commit the inherited value to local. When
	// committed (no longer at-rest), the same `undefined` payload
	// represents a normal `isDeselectable` deselect, so we let it pass
	// through unchanged.
	const setTextTransformWithInheritedCommit = ( newValue ) => {
		if ( isTextTransformPlaceholder && newValue === undefined ) {
			setTextTransform( inheritedTextTransform );
			return;
		}
		setTextTransform( newValue );
	};
	const hasTextTransform = () => hasValue( value?.typography?.textTransform );
	const resetTextTransform = () => setTextTransform( undefined );

	// Text Decoration
	const hasTextDecorationControl = useHasTextDecorationControl( settings );
	const inheritedTextDecoration = decodeValue(
		inheritedValue?.typography?.textDecoration
	);
	const textDecoration =
		decodeValue( value?.typography?.textDecoration ) ??
		inheritedTextDecoration;
	const isTextDecorationPlaceholder =
		! hasValue( value?.typography?.textDecoration ) &&
		hasValue( inheritedTextDecoration );
	const setTextDecoration = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textDecoration' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const setTextDecorationWithInheritedCommit = ( newValue ) => {
		if ( isTextDecorationPlaceholder && newValue === undefined ) {
			setTextDecoration( inheritedTextDecoration );
			return;
		}
		setTextDecoration( newValue );
	};
	const hasTextDecoration = () =>
		hasValue( value?.typography?.textDecoration );
	const resetTextDecoration = () => setTextDecoration( undefined );

	// Text Orientation
	const hasWritingModeControl = useHasWritingModeControl( settings );
	const inheritedWritingMode = decodeValue(
		inheritedValue?.typography?.writingMode
	);
	const writingMode =
		decodeValue( value?.typography?.writingMode ) ?? inheritedWritingMode;
	const isWritingModePlaceholder =
		! hasValue( value?.typography?.writingMode ) &&
		hasValue( inheritedWritingMode );
	const setWritingMode = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'writingMode' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const setWritingModeWithInheritedCommit = ( newValue ) => {
		if ( isWritingModePlaceholder && newValue === undefined ) {
			setWritingMode( inheritedWritingMode );
			return;
		}
		setWritingMode( newValue );
	};
	const hasWritingMode = () => hasValue( value?.typography?.writingMode );
	const resetWritingMode = () => setWritingMode( undefined );

	// Text Alignment
	const hasTextAlignmentControl = useHasTextAlignmentControl( settings );

	const inheritedTextAlign = decodeValue(
		inheritedValue?.typography?.textAlign
	);
	const textAlign =
		decodeValue( value?.typography?.textAlign ) ?? inheritedTextAlign;
	const isTextAlignPlaceholder =
		! hasValue( value?.typography?.textAlign ) &&
		hasValue( inheritedTextAlign );
	const setTextAlign = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textAlign' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const setTextAlignWithInheritedCommit = ( newValue ) => {
		if ( isTextAlignPlaceholder && newValue === undefined ) {
			setTextAlign( inheritedTextAlign );
			return;
		}
		setTextAlign( newValue );
	};
	const hasTextAlign = () => hasValue( value?.typography?.textAlign );
	const resetTextAlign = () => setTextAlign( undefined );

	// Text Shadow
	const hasTextShadowControl = useHasTextShadowControl( settings );
	const inheritedTextShadow = inheritedValue?.typography?.textShadow;
	const textShadow = value?.typography?.textShadow ?? inheritedTextShadow;
	const isTextShadowPlaceholder =
		! hasValue( value?.typography?.textShadow ) &&
		hasValue( inheritedTextShadow );
	const setTextShadow = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textShadow' ],
				newValue || undefined
			)
		);
	};
	const hasTextShadow = () => hasValue( value?.typography?.textShadow );
	const resetTextShadow = () => setTextShadow( undefined );

	const resetAllFilter = useCallback(
		( previousValue ) => {
			if ( ! hasTextColorEnabled ) {
				return {
					...previousValue,
					typography: {},
				};
			}
			return {
				...previousValue,
				typography: {},
				color: {
					...previousValue?.color,
					text: undefined,
				},
			};
		},
		[ hasTextColorEnabled ]
	);

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ hasTextColorEnabled && (
				<ColorGradientDropdownItem
					label={ __( 'Color' ) }
					hasValue={ hasTextColorValue }
					resetValue={ resetTextColor }
					isShownByDefault={ defaultControls.textColor }
					indicators={ [ userTextColor ?? textColor ] }
					contrastWarning={ contrastWarning }
					showInheritanceLabelIndicators={
						showInheritanceLabelIndicators
					}
					isPlaceholder={
						userTextColor === undefined && textColor !== undefined
					}
					hasInheritedValue={ textColor !== undefined }
					tabs={ [
						{
							key: 'text',
							label: __( 'Color' ),
							inheritedValue: textColor,
							inheritedSlug: extractPresetSlug(
								inheritedValue?.color?.text,
								'color'
							),
							userSlug: extractPresetSlug(
								value?.color?.text,
								'color'
							),
							setValue: setTextColor,
							userValue: userTextColor,
							isPlaceholder:
								userTextColor === undefined &&
								textColor !== undefined,
						},
					] }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ hasFontFamilyEnabled && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontFamilyPlaceholder,
						hasFontFamily() && inheritedFontFamily !== undefined
					) }
					label={ __( 'Font' ) }
					hasValue={ hasFontFamily }
					onDeselect={ resetFontFamily }
					isShownByDefault={ defaultControls.fontFamily }
					panelId={ panelId }
				>
					<FontFamilyControl
						fontFamilies={ fontFamilies }
						value={ fontFamily }
						onChange={ setFontFamily }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasFontSizeEnabled && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontSizePlaceholder,
						hasFontSize() && rawInheritedFontSize !== undefined
					) }
					label={ __( 'Size' ) }
					hasValue={ hasFontSize }
					hasInlineEndToggle
					onDeselect={ resetFontSize }
					isShownByDefault={ defaultControls.fontSize }
					panelId={ panelId }
				>
					<FontSizePicker
						value={ currentFontSizeSlug || fontSize }
						valueMode={ currentFontSizeSlug ? 'slug' : 'literal' }
						onChange={ setFontSizeWithInheritedCommit }
						fontSizes={ mergedFontSizes }
						disableCustomFontSizes={ disableCustomFontSizes }
						withReset={ false }
						withSlider
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasFontStyleControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontStylePlaceholder,
						hasFontStyle() && inheritedFontStyle !== undefined
					) }
					label={ __( 'Style' ) }
					hasValue={ hasFontStyle }
					onDeselect={ resetFontStyle }
					isShownByDefault={ isAxisShownByDefault(
						defaultControls,
						'fontStyle'
					) }
					panelId={ panelId }
				>
					{ isVariableFont ? (
						<VariableFontAppearanceControl
							value={ { fontStyle, fontWeight } }
							onChange={ ( next ) =>
								setFontStyle( next.fontStyle )
							}
							hasFontStyles
							hasFontWeights={ false }
							fontFamilyFaces={ fontFamilyFaces }
						/>
					) : (
						<FontAppearanceControl
							value={ { fontStyle, fontWeight } }
							onChange={ ( next ) =>
								setFontStyle( next.fontStyle )
							}
							label={ __( 'Style' ) }
							hasFontStyles
							hasFontWeights={ false }
							fontFamilyFaces={ fontFamilyFaces }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ hasFontWeightControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontWeightPlaceholder,
						hasFontWeight() && inheritedFontWeight !== undefined
					) }
					label={ __( 'Weight' ) }
					hasValue={ hasFontWeight }
					onDeselect={ resetFontWeight }
					isShownByDefault={ isAxisShownByDefault(
						defaultControls,
						'fontWeight'
					) }
					panelId={ panelId }
				>
					{ isVariableFont ? (
						<VariableFontAppearanceControl
							value={ { fontStyle, fontWeight } }
							onChange={ ( next ) =>
								setFontWeight( next.fontWeight )
							}
							hasFontStyles={ false }
							hasFontWeights
							fontFamilyFaces={ fontFamilyFaces }
						/>
					) : (
						<FontAppearanceControl
							value={ { fontStyle, fontWeight } }
							onChange={ ( next ) =>
								setFontWeight( next.fontWeight )
							}
							label={ __( 'Weight' ) }
							hasFontStyles={ false }
							hasFontWeights
							fontFamilyFaces={ fontFamilyFaces }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ hasFontStretchControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontStretchPlaceholder,
						hasFontStretch() && inheritedFontStretch !== undefined
					) }
					label={ __( 'Width' ) }
					hasValue={ hasFontStretch }
					onDeselect={ resetFontStretch }
					isShownByDefault={ isAxisShownByDefault(
						defaultControls,
						'fontStretch'
					) }
					panelId={ panelId }
				>
					<FontWidthControl
						value={ fontStretch }
						onChange={ setFontStretch }
						fontFamilyFaces={ fontFamilyFaces }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasLineHeightEnabled && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isLineHeightPlaceholder,
						hasLineHeight() && inheritedLineHeight !== undefined,
						'single-column'
					) }
					label={ __( 'Line height' ) }
					hasValue={ hasLineHeight }
					onDeselect={ resetLineHeight }
					isShownByDefault={ defaultControls.lineHeight }
					panelId={ panelId }
				>
					<LineHeightControl
						__unstableInputWidth="auto"
						value={ localLineHeight ?? inheritedLineHeight }
						onChange={ setLineHeight }
						// Only override the placeholder when there is an
						// inherited value to surface. Passing `undefined` would
						// clobber `LineHeightControl`'s own `BASE_DEFAULT_VALUE`
						// (1.5) placeholder.
						{ ...( isLineHeightPlaceholder
							? {
									placeholder:
										getNumericPlaceholder(
											inheritedLineHeight
										),
								}
							: {} ) }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasLetterSpacingControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isLetterSpacingPlaceholder,
						hasLetterSpacing() &&
							inheritedLetterSpacing !== undefined,
						'single-column'
					) }
					label={ __( 'Letter spacing' ) }
					hasValue={ hasLetterSpacing }
					onDeselect={ resetLetterSpacing }
					isShownByDefault={ defaultControls.letterSpacing }
					panelId={ panelId }
				>
					<LetterSpacingControl
						// Local-then-inherited: render the inherited value as
						// the control's value at rest so the unit parses from
						// it (e.g. "0.02em" keeps the em unit rather than the
						// value string sitting behind a default px unit). It is
						// only written to local on user change. Matches the
						// ToggleGroup/FontSize controls rather than the
						// native-placeholder pattern.
						value={ localLetterSpacing ?? inheritedLetterSpacing }
						onChange={ setLetterSpacing }
						__unstableInputWidth="auto"
						placeholder={
							isLetterSpacingPlaceholder
								? getNumericPlaceholder(
										inheritedLetterSpacing
									)
								: undefined
						}
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasTextIndentControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextIndentPlaceholder,
						hasTextIndent() && inheritedTextIndent !== undefined
					) }
					label={ __( 'Line indent' ) }
					hasValue={ hasTextIndent }
					onDeselect={ resetTextIndent }
					isShownByDefault={ defaultControls.textIndent }
					panelId={ panelId }
				>
					<TextIndentControl
						// Local-then-inherited: render the inherited value as
						// the control's value at rest so the UnitControl parses
						// and shows the inherited unit (e.g. `1.5em` selects the
						// `em` unit) instead of a raw string in the placeholder
						// while the unit stays at the default `px`. Written to
						// local only on user change.
						value={ localTextIndent ?? inheritedTextIndent }
						onChange={ setTextIndentValue }
						__unstableInputWidth="auto"
						withSlider
						hasBottomMargin={ isGlobalStyles }
						placeholder={
							isTextIndentPlaceholder
								? getNumericPlaceholder( inheritedTextIndent )
								: undefined
						}
					/>
					{ isGlobalStyles && (
						<ToggleControl
							label={ __( 'Indent all paragraphs' ) }
							checked={ isTextIndentAll }
							onChange={ onToggleTextIndentAll }
							help={ textIndentHelp }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ hasTextColumnsControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextColumnsPlaceholder,
						hasTextColumns() && inheritedTextColumns !== undefined,
						'single-column'
					) }
					label={ __( 'Columns' ) }
					hasValue={ hasTextColumns }
					onDeselect={ resetTextColumns }
					isShownByDefault={ defaultControls.textColumns }
					panelId={ panelId }
				>
					<NumberControl
						label={ __( 'Columns' ) }
						max={ MAX_TEXT_COLUMNS }
						min={ MIN_TEXT_COLUMNS }
						onChange={ setTextColumns }
						placeholder={
							isTextColumnsPlaceholder
								? inheritedTextColumns
								: undefined
						}
						spinControls="custom"
						value={ localTextColumns }
						initialPosition={ 1 }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasTextDecorationControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextDecorationPlaceholder,
						hasTextDecoration() &&
							inheritedTextDecoration !== undefined,
						'single-column'
					) }
					label={ __( 'Decoration' ) }
					hasValue={ hasTextDecoration }
					onDeselect={ resetTextDecoration }
					isShownByDefault={ defaultControls.textDecoration }
					panelId={ panelId }
				>
					<TextDecorationControl
						value={ textDecoration }
						onChange={ setTextDecorationWithInheritedCommit }
						__unstableInputWidth="auto"
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasWritingModeControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isWritingModePlaceholder,
						hasWritingMode() && inheritedWritingMode !== undefined,
						'single-column'
					) }
					label={ __( 'Orientation' ) }
					hasValue={ hasWritingMode }
					onDeselect={ resetWritingMode }
					isShownByDefault={ defaultControls.writingMode }
					panelId={ panelId }
				>
					<WritingModeControl
						value={ writingMode }
						onChange={ setWritingModeWithInheritedCommit }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasTextTransformControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextTransformPlaceholder,
						hasTextTransform() &&
							inheritedTextTransform !== undefined
					) }
					label={ __( 'Letter case' ) }
					hasValue={ hasTextTransform }
					onDeselect={ resetTextTransform }
					isShownByDefault={ defaultControls.textTransform }
					panelId={ panelId }
				>
					<TextTransformControl
						value={ textTransform }
						onChange={ setTextTransformWithInheritedCommit }
						showNone
						isBlock
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasTextShadowControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextShadowPlaceholder,
						hasTextShadow() && inheritedTextShadow !== undefined
					) }
					label={ __( 'Text shadow' ) }
					hasValue={ hasTextShadow }
					onDeselect={ resetTextShadow }
					isShownByDefault={ defaultControls.textShadow }
					panelId={ panelId }
				>
					<TextShadowPopover
						textShadow={ textShadow }
						onChange={ setTextShadow }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ hasTextAlignmentControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isTextAlignPlaceholder,
						hasTextAlign() && inheritedTextAlign !== undefined
					) }
					label={ __( 'Text alignment' ) }
					hasValue={ hasTextAlign }
					onDeselect={ resetTextAlign }
					isShownByDefault={ defaultControls.textAlign }
					panelId={ panelId }
				>
					<TextAlignmentControl
						value={ textAlign }
						onChange={ setTextAlignWithInheritedCommit }
						options={ [ 'left', 'center', 'right', 'justify' ] }
					/>

					{ textAlign === 'justify' && (
						<div>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Justified text can reduce readability. For better accessibility, use left-aligned text instead.'
								) }
							</Notice>
						</div>
					) }
				</InheritanceToolsPanelItem>
			) }
		</Wrapper>
	);
}
