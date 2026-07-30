/**
 * WordPress dependencies
 */
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

/**
 * Internal dependencies
 */
import FontFamilyControl from '../font-family';
import FontAppearanceControl from '../font-appearance-control';
import LineHeightControl from '../line-height-control';
import LetterSpacingControl from '../letter-spacing-control';
import TextAlignmentControl from '../text-alignment-control';
import TextTransformControl from '../text-transform-control';
import TextDecorationControl from '../text-decoration-control';
import TextIndentControl from '../text-indent-control';
import WritingModeControl from '../writing-mode-control';
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
import {
	getInheritanceProps,
	InheritanceToolsPanelItem,
	isGlobalStylesInheritanceEnabled,
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
	const hasFontAppearance = useHasAppearanceControl( settings );
	const hasLetterSpacing = useHasLetterSpacingControl( settings );
	const hasTextAlign = useHasTextAlignmentControl( settings );
	const hasTextTransform = useHasTextTransformControl( settings );
	const hasTextDecoration = useHasTextDecorationControl( settings );
	const hasTextIndent = useHasTextIndentControl( settings );
	const hasWritingMode = useHasWritingModeControl( settings );
	const hasTextColumns = useHasTextColumnsControl( settings );
	const hasFontSize = useHasFontSizeControl( settings );
	const hasTextColor = useHasTextPanel( settings );

	return (
		hasFontFamily ||
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		hasTextAlign ||
		hasTextTransform ||
		hasFontSize ||
		hasTextDecoration ||
		hasTextIndent ||
		hasWritingMode ||
		hasTextColumns ||
		hasTextColor
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

function useHasAppearanceControl( settings ) {
	return settings?.typography?.fontStyle || settings?.typography?.fontWeight;
}

function useAppearanceControlLabel( settings ) {
	if ( ! settings?.typography?.fontStyle ) {
		return __( 'Font weight' );
	}
	if ( ! settings?.typography?.fontWeight ) {
		return __( 'Font style' );
	}
	return __( 'Appearance' );
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
		...( defaultFontSizesEnabled ? fontSizes?.default ?? [] : [] ),
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
	showInheritanceLabelIndicators = isGlobalStylesInheritanceEnabled(),
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
		// With the experiment off, keep the pre-inheritance comparison on
		// `inheritedValue`.
		const syncLinkColor = isGlobalStylesInheritanceEnabled()
			? shouldSyncLinkColor( value, inheritedValue )
			: inheritedValue?.color?.text ===
			  inheritedValue?.elements?.link?.color?.text;
		if ( syncLinkColor ) {
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
		const hasFontWeight = fontWeights?.some(
			( { value: fw } ) => fw?.toString() === fontWeight?.toString()
		);

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

	// Appearance
	const hasAppearanceControl = useHasAppearanceControl( settings );
	const appearanceControlLabel = useAppearanceControlLabel( settings );
	const hasFontStyles = settings?.typography?.fontStyle;
	const hasFontWeights = settings?.typography?.fontWeight;
	// Render local-then-inherited; placeholder fires only when both
	// local leaves are unset and at least one inherited leaf exists.
	const inheritedFontStyle = decodeValue(
		inheritedValue?.typography?.fontStyle
	);
	const inheritedFontWeight = decodeValue(
		inheritedValue?.typography?.fontWeight
	);
	const fontStyle =
		decodeValue( value?.typography?.fontStyle ) ?? inheritedFontStyle;
	const fontWeight =
		decodeValue( value?.typography?.fontWeight ) ?? inheritedFontWeight;
	const isFontAppearancePlaceholder =
		! hasValue( value?.typography?.fontStyle ) &&
		! hasValue( value?.typography?.fontWeight ) &&
		( hasValue( inheritedFontStyle ) || hasValue( inheritedFontWeight ) );
	const setFontAppearance = useCallback(
		( { fontStyle: newFontStyle, fontWeight: newFontWeight } ) => {
			// Only update the font style and weight if they have changed.
			if ( newFontStyle !== fontStyle || newFontWeight !== fontWeight ) {
				onChange( {
					...value,
					typography: {
						...value?.typography,
						fontStyle: hasValue( newFontStyle )
							? newFontStyle
							: undefined,
						fontWeight: hasValue( newFontWeight )
							? newFontWeight
							: undefined,
					},
				} );
			}
		},
		[ fontStyle, fontWeight, onChange, value ]
	);
	// Display-without-commit interceptor for FontAppearance: when the
	// control is at rest (no local override, displaying the inherited
	// font style/weight), activating the already-preselected option
	// would otherwise be swallowed by the equality short-circuit in
	// `setFontAppearance`. Treat that activation as the user's
	// "accept this inherited value" affordance and commit the
	// inherited values to local explicitly.
	const setFontAppearanceWithInheritedCommit = useCallback(
		( next ) => {
			if (
				isFontAppearancePlaceholder &&
				next.fontStyle === fontStyle &&
				next.fontWeight === fontWeight
			) {
				onChange( {
					...value,
					typography: {
						...value?.typography,
						fontStyle: hasValue( fontStyle )
							? fontStyle
							: undefined,
						fontWeight: hasValue( fontWeight )
							? fontWeight
							: undefined,
					},
				} );
				return;
			}
			setFontAppearance( next );
		},
		[
			isFontAppearancePlaceholder,
			fontStyle,
			fontWeight,
			onChange,
			value,
			setFontAppearance,
		]
	);
	const hasFontAppearance = () =>
		hasValue( value?.typography?.fontStyle ) ||
		hasValue( value?.typography?.fontWeight );
	const resetFontAppearance = useCallback( () => {
		setFontAppearance( {} );
	}, [ setFontAppearance ] );

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
			{ hasAppearanceControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isFontAppearancePlaceholder,
						hasFontAppearance() &&
							( inheritedFontStyle !== undefined ||
								inheritedFontWeight !== undefined )
					) }
					label={ appearanceControlLabel }
					hasValue={ hasFontAppearance }
					onDeselect={ resetFontAppearance }
					isShownByDefault={ defaultControls.fontAppearance }
					panelId={ panelId }
				>
					<FontAppearanceControl
						value={ {
							fontStyle,
							fontWeight,
						} }
						onChange={ setFontAppearanceWithInheritedCommit }
						hasFontStyles={ hasFontStyles }
						hasFontWeights={ hasFontWeights }
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
