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
	PanelBody,
	FontSizePicker,
	__experimentalSpacer as Spacer,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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

	const [ fontFamily, setFontFamily ] = useStyle(
		prefix + 'typography.fontFamily',
		name
	);
	const [ fontSize, setFontSize ] = useStyle(
		prefix + 'typography.fontSize',
		name
	);

	const [ fontStyle, setFontStyle ] = useStyle(
		prefix + 'typography.fontStyle',
		name
	);
	const [ fontWeight, setFontWeight ] = useStyle(
		prefix + 'typography.fontWeight',
		name
	);
	const [ lineHeight, setLineHeight ] = useStyle(
		prefix + 'typography.lineHeight',
		name
	);
	const [ letterSpacing, setLetterSpacing ] = useStyle(
		prefix + 'typography.letterSpacing',
		name
	);
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
		<PanelBody className="edit-site-typography-panel" initialOpen={ true }>
			<div
				className="edit-site-typography-panel__preview"
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
				<div>
					<h4>{ __( 'Select heading level' ) }</h4>
					<ToggleGroupControl
						label={ __( 'Select heading level' ) }
						hideLabelFromVision={ true }
						value={ selectedLevel }
						onChange={ setCurrentTab }
						isBlock
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
				<FontFamilyControl
					fontFamilies={ fontFamilies }
					value={ fontFamily }
					onChange={ setFontFamily }
				/>
			) }
			{ hasFontSizeEnabled && (
				<FontSizePicker
					value={ fontSize }
					onChange={ setFontSize }
					fontSizes={ fontSizes }
					disableCustomFontSizes={ disableCustomFontSizes }
				/>
			) }
			{ hasLineHeightEnabled && (
				<Spacer marginBottom={ 6 }>
					<LineHeightControl
						__nextHasNoMarginBottom={ true }
						value={ lineHeight }
						onChange={ setLineHeight }
					/>
				</Spacer>
			) }
			{ hasAppearanceControl && (
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
				/>
			) }
			{ hasLetterSpacingControl && (
				<LetterSpacingControl
					value={ letterSpacing }
					onChange={ setLetterSpacing }
				/>
			) }
		</PanelBody>
	);
}
