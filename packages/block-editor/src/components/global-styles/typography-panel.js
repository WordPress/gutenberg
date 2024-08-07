/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useEffect } from '@wordpress/element';

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
import WritingModeControl from '../writing-mode-control';
import { getValueFromVariable, useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import {
	getMergedFontFamiliesAndFontFamilyFaces,
	findNearestStyleAndWeight,
} from './typography-utils';

const MIN_TEXT_COLUMNS = 1;
const MAX_TEXT_COLUMNS = 6;

export function useHasTypographyPanel( settings ) {
	const hasFontFamily = useHasFontFamilyControl( settings );
	const hasLineHeight = useHasLineHeightControl( settings );
	const hasFontAppearance = useHasAppearanceControl( settings );
	const hasLetterSpacing = useHasLetterSpacingControl( settings );
	const hasTextAlign = useHasTextAlignmentControl( settings );
	const hasTextTransform = useHasTextTransformControl( settings );
	const hasTextDecoration = useHasTextDecorationControl( settings );
	const hasWritingMode = useHasWritingModeControl( settings );
	const hasTextColumns = useHasTextColumnsControl( settings );
	const hasFontSize = useHasFontSizeControl( settings );

	return (
		hasFontFamily ||
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		hasTextAlign ||
		hasTextTransform ||
		hasFontSize ||
		hasTextDecoration ||
		hasWritingMode ||
		hasTextColumns
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

function TypographyToolsPanel( {
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
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	fontFamily: true,
	fontSize: true,
	fontAppearance: true,
	lineHeight: true,
	letterSpacing: true,
	textAlign: true,
	textTransform: true,
	textDecoration: true,
	writingMode: true,
	textColumns: true,
};

export default function TypographyPanel( {
	as: Wrapper = TypographyToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	// Font Family
	const hasFontFamilyEnabled = useHasFontFamilyControl( settings );
	const fontFamily = decodeValue( inheritedValue?.typography?.fontFamily );
	const { fontFamilies, fontFamilyFaces } = useMemo( () => {
		return getMergedFontFamiliesAndFontFamilyFaces( settings, fontFamily );
	}, [ settings, fontFamily ] );

	const setFontFamily = ( newValue ) => {
		const slug = fontFamilies?.find(
			( { fontFamily: f } ) => f === newValue
		)?.slug;
		onChange(
			setImmutably(
				value,
				[ 'typography', 'fontFamily' ],
				slug
					? `var:preset|font-family|${ slug }`
					: newValue || undefined
			)
		);
	};
	const hasFontFamily = () => !! value?.typography?.fontFamily;
	const resetFontFamily = () => setFontFamily( undefined );

	// Font Size
	const hasFontSizeEnabled = useHasFontSizeControl( settings );
	const disableCustomFontSizes = ! settings?.typography?.customFontSize;
	const mergedFontSizes = getMergedFontSizes( settings );

	const fontSize = decodeValue( inheritedValue?.typography?.fontSize );
	const setFontSize = ( newValue, metadata ) => {
		const actualValue = !! metadata?.slug
			? `var:preset|font-size|${ metadata?.slug }`
			: newValue;

		onChange(
			setImmutably(
				value,
				[ 'typography', 'fontSize' ],
				actualValue || undefined
			)
		);
	};
	const hasFontSize = () => !! value?.typography?.fontSize;
	const resetFontSize = () => setFontSize( undefined );

	// Appearance
	const hasAppearanceControl = useHasAppearanceControl( settings );
	const appearanceControlLabel = useAppearanceControlLabel( settings );
	const hasFontStyles = settings?.typography?.fontStyle;
	const hasFontWeights = settings?.typography?.fontWeight;
	const fontStyle = decodeValue( inheritedValue?.typography?.fontStyle );
	const fontWeight = decodeValue( inheritedValue?.typography?.fontWeight );
	const { nearestFontStyle, nearestFontWeight } = findNearestStyleAndWeight(
		fontFamilyFaces,
		fontStyle,
		fontWeight
	);
	const setFontAppearance = useCallback(
		( { fontStyle: newFontStyle, fontWeight: newFontWeight } ) => {
			// Only update the font style and weight if they have changed.
			if ( newFontStyle !== fontStyle || newFontWeight !== fontWeight ) {
				onChange( {
					...value,
					typography: {
						...value?.typography,
						fontStyle: newFontStyle || undefined,
						fontWeight: newFontWeight || undefined,
					},
				} );
			}
		},
		[ fontStyle, fontWeight, onChange, value ]
	);
	const hasFontAppearance = () =>
		!! value?.typography?.fontStyle || !! value?.typography?.fontWeight;
	const resetFontAppearance = useCallback( () => {
		setFontAppearance( {} );
	}, [ setFontAppearance ] );

	// Check if previous font style and weight values are available in the new font family.
	useEffect( () => {
		if ( nearestFontStyle && nearestFontWeight ) {
			setFontAppearance( {
				fontStyle: nearestFontStyle,
				fontWeight: nearestFontWeight,
			} );
		} else {
			// Reset font appearance if there are no available styles or weights.
			resetFontAppearance();
		}
	}, [
		nearestFontStyle,
		nearestFontWeight,
		resetFontAppearance,
		setFontAppearance,
	] );

	// Line Height
	const hasLineHeightEnabled = useHasLineHeightControl( settings );
	const lineHeight = decodeValue( inheritedValue?.typography?.lineHeight );
	const setLineHeight = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'lineHeight' ],
				newValue || undefined
			)
		);
	};
	const hasLineHeight = () => value?.typography?.lineHeight !== undefined;
	const resetLineHeight = () => setLineHeight( undefined );

	// Letter Spacing
	const hasLetterSpacingControl = useHasLetterSpacingControl( settings );
	const letterSpacing = decodeValue(
		inheritedValue?.typography?.letterSpacing
	);
	const setLetterSpacing = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'letterSpacing' ],
				newValue || undefined
			)
		);
	};
	const hasLetterSpacing = () => !! value?.typography?.letterSpacing;
	const resetLetterSpacing = () => setLetterSpacing( undefined );

	// Text Columns
	const hasTextColumnsControl = useHasTextColumnsControl( settings );
	const textColumns = decodeValue( inheritedValue?.typography?.textColumns );
	const setTextColumns = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textColumns' ],
				newValue || undefined
			)
		);
	};
	const hasTextColumns = () => !! value?.typography?.textColumns;
	const resetTextColumns = () => setTextColumns( undefined );

	// Text Transform
	const hasTextTransformControl = useHasTextTransformControl( settings );
	const textTransform = decodeValue(
		inheritedValue?.typography?.textTransform
	);
	const setTextTransform = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textTransform' ],
				newValue || undefined
			)
		);
	};
	const hasTextTransform = () => !! value?.typography?.textTransform;
	const resetTextTransform = () => setTextTransform( undefined );

	// Text Decoration
	const hasTextDecorationControl = useHasTextDecorationControl( settings );
	const textDecoration = decodeValue(
		inheritedValue?.typography?.textDecoration
	);
	const setTextDecoration = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textDecoration' ],
				newValue || undefined
			)
		);
	};
	const hasTextDecoration = () => !! value?.typography?.textDecoration;
	const resetTextDecoration = () => setTextDecoration( undefined );

	// Text Orientation
	const hasWritingModeControl = useHasWritingModeControl( settings );
	const writingMode = decodeValue( inheritedValue?.typography?.writingMode );
	const setWritingMode = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'writingMode' ],
				newValue || undefined
			)
		);
	};
	const hasWritingMode = () => !! value?.typography?.writingMode;
	const resetWritingMode = () => setWritingMode( undefined );

	// Text Alignment
	const hasTextAlignmentControl = useHasTextAlignmentControl( settings );

	const textAlign = decodeValue( inheritedValue?.typography?.textAlign );
	const setTextAlign = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'typography', 'textAlign' ],
				newValue || undefined
			)
		);
	};
	const hasTextAlign = () => !! value?.typography?.textAlign;
	const resetTextAlign = () => setTextAlign( undefined );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			typography: {},
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ hasFontFamilyEnabled && (
				<ToolsPanelItem
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
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasFontSizeEnabled && (
				<ToolsPanelItem
					label={ __( 'Size' ) }
					hasValue={ hasFontSize }
					onDeselect={ resetFontSize }
					isShownByDefault={ defaultControls.fontSize }
					panelId={ panelId }
				>
					<FontSizePicker
						value={ fontSize }
						onChange={ setFontSize }
						fontSizes={ mergedFontSizes }
						disableCustomFontSizes={ disableCustomFontSizes }
						withReset={ false }
						withSlider
						size="__unstable-large"
					/>
				</ToolsPanelItem>
			) }
			{ hasAppearanceControl && (
				<ToolsPanelItem
					className="single-column"
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
						onChange={ setFontAppearance }
						hasFontStyles={ hasFontStyles }
						hasFontWeights={ hasFontWeights }
						fontFamilyFaces={ fontFamilyFaces }
						size="__unstable-large"
					/>
				</ToolsPanelItem>
			) }
			{ hasLineHeightEnabled && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Line height' ) }
					hasValue={ hasLineHeight }
					onDeselect={ resetLineHeight }
					isShownByDefault={ defaultControls.lineHeight }
					panelId={ panelId }
				>
					<LineHeightControl
						__unstableInputWidth="auto"
						value={ lineHeight }
						onChange={ setLineHeight }
						size="__unstable-large"
					/>
				</ToolsPanelItem>
			) }
			{ hasLetterSpacingControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Letter spacing' ) }
					hasValue={ hasLetterSpacing }
					onDeselect={ resetLetterSpacing }
					isShownByDefault={ defaultControls.letterSpacing }
					panelId={ panelId }
				>
					<LetterSpacingControl
						value={ letterSpacing }
						onChange={ setLetterSpacing }
						size="__unstable-large"
						__unstableInputWidth="auto"
					/>
				</ToolsPanelItem>
			) }
			{ hasTextColumnsControl && (
				<ToolsPanelItem
					className="single-column"
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
						size="__unstable-large"
						spinControls="custom"
						value={ textColumns }
						initialPosition={ 1 }
					/>
				</ToolsPanelItem>
			) }
			{ hasTextDecorationControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Decoration' ) }
					hasValue={ hasTextDecoration }
					onDeselect={ resetTextDecoration }
					isShownByDefault={ defaultControls.textDecoration }
					panelId={ panelId }
				>
					<TextDecorationControl
						value={ textDecoration }
						onChange={ setTextDecoration }
						size="__unstable-large"
						__unstableInputWidth="auto"
					/>
				</ToolsPanelItem>
			) }
			{ hasWritingModeControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Orientation' ) }
					hasValue={ hasWritingMode }
					onDeselect={ resetWritingMode }
					isShownByDefault={ defaultControls.writingMode }
					panelId={ panelId }
				>
					<WritingModeControl
						value={ writingMode }
						onChange={ setWritingMode }
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasTextTransformControl && (
				<ToolsPanelItem
					label={ __( 'Letter case' ) }
					hasValue={ hasTextTransform }
					onDeselect={ resetTextTransform }
					isShownByDefault={ defaultControls.textTransform }
					panelId={ panelId }
				>
					<TextTransformControl
						value={ textTransform }
						onChange={ setTextTransform }
						showNone
						isBlock
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasTextAlignmentControl && (
				<ToolsPanelItem
					label={ __( 'Text alignment' ) }
					hasValue={ hasTextAlign }
					onDeselect={ resetTextAlign }
					isShownByDefault={ defaultControls.textAlign }
					panelId={ panelId }
				>
					<TextAlignmentControl
						value={ textAlign }
						onChange={ setTextAlign }
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
