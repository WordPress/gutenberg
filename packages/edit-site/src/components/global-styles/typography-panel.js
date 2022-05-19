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
} from '@wordpress/components';

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
	const supports = getSupportedGlobalStylesPanels( name );
	const prefix =
		element === 'text' || ! element ? '' : `elements.${ element }.`;
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

			{ supports.includes( 'fontFamily' ) && (
				<FontFamilyControl
					fontFamilies={ fontFamilies }
					value={ fontFamily }
					onChange={ setFontFamily }
				/>
			) }
			{ supports.includes( 'fontSize' ) && (
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
