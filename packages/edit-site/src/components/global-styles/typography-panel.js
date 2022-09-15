/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontAppearanceControl as FontAppearanceControl,
	__experimentalLetterSpacingControl as LetterSpacingControl,
} from '@wordpress/block-editor';
import {
	FontSizePicker,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

export function useHasTypographyPanel( name ) {
	const hasLineHeight = useHasLineHeightControl( name );
	const hasFontAppearance = useHasAppearanceControl( name );
	const hasLetterSpacing = useHasLetterSpacingControl( name );
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		supports.includes( 'fontSize' )
	);
}

function useHasLineHeightControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.lineHeight', name )[ 0 ] &&
		supports.includes( 'lineHeight' )
	);
}

function useHasAppearanceControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasFontStyles =
		useSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

function useHasLetterSpacingControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.letterSpacing', name )[ 0 ] &&
		supports.includes( 'letterSpacing' )
	);
}

function useFontFamily( prefix, name ) {
	const [ fontFamily, setFontFamily ] = useStyle(
		prefix + 'typography.fontFamily',
		name
	);
	const [ userFontFamily ] = useStyle(
		prefix + 'typography.fontFamily',
		name,
		'user'
	);
	const hasFontFamily = () => !! userFontFamily;
	const resetFontFamily = () => setFontFamily( undefined );
	return {
		fontFamily,
		setFontFamily,
		hasFontFamily,
		resetFontFamily,
	};
}

function useFontSize( prefix, name ) {
	const [ fontSize, setFontSize ] = useStyle(
		prefix + 'typography.fontSize',
		name
	);
	const [ userFontSize ] = useStyle(
		prefix + 'typography.fontSize',
		name,
		'user'
	);
	const hasFontSize = () => !! userFontSize;
	const resetFontSize = () => setFontSize( undefined );
	return {
		fontSize,
		setFontSize,
		hasFontSize,
		resetFontSize,
	};
}

function useFontAppearance( prefix, name ) {
	const [ fontStyle, setFontStyle ] = useStyle(
		prefix + 'typography.fontStyle',
		name
	);
	const [ userFontStyle ] = useStyle(
		prefix + 'typography.fontStyle',
		name,
		'user'
	);
	const [ fontWeight, setFontWeight ] = useStyle(
		prefix + 'typography.fontWeight',
		name
	);
	const [ userFontWeight ] = useStyle(
		prefix + 'typography.fontWeight',
		name,
		'user'
	);
	const hasFontAppearance = () => !! userFontStyle || !! userFontWeight;
	const resetFontAppearance = () => {
		setFontStyle( undefined );
		setFontWeight( undefined );
	};
	return {
		fontStyle,
		setFontStyle,
		fontWeight,
		setFontWeight,
		hasFontAppearance,
		resetFontAppearance,
	};
}

function useLineHeight( prefix, name ) {
	const [ lineHeight, setLineHeight ] = useStyle(
		prefix + 'typography.lineHeight',
		name
	);
	const [ userLineHeight ] = useStyle(
		prefix + 'typography.lineHeight',
		name,
		'user'
	);
	const hasLineHeight = () => !! userLineHeight;
	const resetLineHeight = () => setLineHeight( undefined );
	return {
		lineHeight,
		setLineHeight,
		hasLineHeight,
		resetLineHeight,
	};
}

function useLetterSpacing( prefix, name ) {
	const [ letterSpacing, setLetterSpacing ] = useStyle(
		prefix + 'typography.letterSpacing',
		name
	);
	const [ userLetterSpacing ] = useStyle(
		prefix + 'typography.letterSpacing',
		name,
		'user'
	);
	const hasLetterSpacing = () => !! userLetterSpacing;
	const resetLetterSpacing = () => setLetterSpacing( undefined );
	return {
		letterSpacing,
		setLetterSpacing,
		hasLetterSpacing,
		resetLetterSpacing,
	};
}

/*
 * @todo:
 * - check above against what's in hooks/typogrpahy.js. maybe reset logic is
 *   weird for some of the attributes
 * - combine the simple ones into a single hook since the logic is the same
 */

export default function TypographyPanel( { name, element } ) {
	const [ selectedLevel, setCurrentTab ] = useState( 'heading' );
	const supports = getSupportedGlobalStylesPanels( name );
	let prefix = '';
	if ( element === 'heading' ) {
		prefix = `elements.${ selectedLevel }.`;
	} else if ( element && element !== 'text' ) {
		prefix = `elements.${ element }.`;
	}
	const [ fontSizes ] = useSetting( 'typography.fontSizes', name );
	const disableCustomFontSizes = ! useSetting(
		'typography.customFontSize',
		name
	)[ 0 ];
	const [ fontFamilies ] = useSetting( 'typography.fontFamilies', name );
	const hasFontStyles =
		useSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	const hasLineHeightEnabled = useHasLineHeightControl( name );
	const hasAppearanceControl = useHasAppearanceControl( name );
	const hasLetterSpacingControl = useHasLetterSpacingControl( name );

	/* Disable font size controls when the option to style all headings is selected. */
	let hasFontSizeEnabled = supports.includes( 'fontSize' );
	if ( element === 'heading' && selectedLevel === 'heading' ) {
		hasFontSizeEnabled = false;
	}

	const { fontFamily, setFontFamily, hasFontFamily, resetFontFamily } =
		useFontFamily( prefix, name );
	const { fontSize, setFontSize, hasFontSize, resetFontSize } = useFontSize(
		prefix,
		name
	);
	const {
		fontStyle,
		setFontStyle,
		fontWeight,
		setFontWeight,
		hasFontAppearance,
		resetFontAppearance,
	} = useFontAppearance( prefix, name );
	const { lineHeight, setLineHeight, hasLineHeight, resetLineHeight } =
		useLineHeight( prefix, name );
	const {
		letterSpacing,
		setLetterSpacing,
		hasLetterSpacing,
		resetLetterSpacing,
	} = useLetterSpacing( prefix, name );

	const resetAll = () => {
		resetFontFamily();
		resetFontSize();
		resetFontAppearance();
		resetLineHeight();
		resetLetterSpacing();
	};

	const [ backgroundColor ] = useStyle( prefix + 'color.background', name );
	const [ gradientValue ] = useStyle( prefix + 'color.gradient', name );
	const [ color ] = useStyle( prefix + 'color.text', name );
	const extraStyles =
		element === 'link'
			? {
					textDecoration: 'underline',
			  }
			: {};

	return (
		<>
			<ToolsPanel label={ __( 'Typography' ) } resetAll={ resetAll }>
				<div
					className="edit-site-typography-panel__preview span-columns"
					style={ {
						fontFamily: fontFamily ?? 'serif',
						background: gradientValue ?? backgroundColor,
						color,
						fontSize,
						fontStyle,
						fontWeight,
						letterSpacing,
						...extraStyles,
					} }
				>
					Aa
				</div>
				{ element === 'heading' && (
					<div className="span-columns">
						<ToggleGroupControl
							label={ __( 'Select heading level' ) }
							hideLabelFromVision
							value={ selectedLevel }
							onChange={ setCurrentTab }
							isBlock
							size="__unstable-large"
							__nextHasNoMarginBottom
						>
							<ToggleGroupControlOption
								value="heading"
								/* translators: 'All' refers to selecting all heading levels 
							and applying the same style to h1-h6. */
								label={ __( 'All' ) }
							/>
							<ToggleGroupControlOption
								value="h1"
								label={ __( 'H1' ) }
							/>
							<ToggleGroupControlOption
								value="h2"
								label={ __( 'H2' ) }
							/>
							<ToggleGroupControlOption
								value="h3"
								label={ __( 'H3' ) }
							/>
							<ToggleGroupControlOption
								value="h4"
								label={ __( 'H4' ) }
							/>
							<ToggleGroupControlOption
								value="h5"
								label={ __( 'H5' ) }
							/>
							<ToggleGroupControlOption
								value="h6"
								label={ __( 'H6' ) }
							/>
						</ToggleGroupControl>
					</div>
				) }
				{ supports.includes( 'fontFamily' ) && (
					<ToolsPanelItem
						label={ __( 'Font family' ) }
						hasValue={ hasFontFamily }
						onDeselect={ resetFontFamily }
						isShownByDefault
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
						label={ __( 'Font size' ) }
						hasValue={ hasFontSize }
						onDeselect={ resetFontSize }
						isShownByDefault
					>
						<FontSizePicker
							value={ fontSize }
							onChange={ setFontSize }
							fontSizes={ fontSizes }
							disableCustomFontSizes={ disableCustomFontSizes }
							size="__unstable-large"
							__nextHasNoMarginBottom
						/>
					</ToolsPanelItem>
				) }
				{ hasAppearanceControl && (
					<ToolsPanelItem
						className="single-column"
						label={ __( 'Appearance' ) } // TODO: Should say 'Font weight' and 'Font style' if only one is enabled
						hasValue={ hasFontAppearance }
						onDeselect={ resetFontAppearance }
						isShownByDefault
					>
						<FontAppearanceControl
							value={ {
								fontStyle,
								fontWeight,
							} }
							onChange={ ( {
								fontStyle: newFontStyle,
								fontWeight: newFontWeight,
							} ) => {
								setFontStyle( newFontStyle );
								setFontWeight( newFontWeight );
							} }
							hasFontStyles={ hasFontStyles }
							hasFontWeights={ hasFontWeights }
							size="__unstable-large"
							__nextHasNoMarginBottom
						/>
					</ToolsPanelItem>
				) }
				{ hasLineHeightEnabled && (
					<ToolsPanelItem
						className="single-column"
						label={ __( 'Line height' ) }
						hasValue={ hasLineHeight }
						onDeselect={ resetLineHeight }
						isShownByDefault
					>
						<LineHeightControl
							__nextHasNoMarginBottom
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
						isShownByDefault
					>
						<LetterSpacingControl
							value={ letterSpacing }
							onChange={ setLetterSpacing }
							size="__unstable-large"
							__unstableInputWidth="auto"
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</>
	);
}
