/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	__unstableMotion as motion,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useStylesPreviewColors } from './hooks';
import PreviewTypography from './preview-typography';
import PreviewHighlightedColors from './preview-highlighted-colors';
import PreviewWrapper from './preview-wrapper';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const StylesPreview = ( { label, isFocused, withHoverView, variation } ) => {
	const [ fontWeight ] = useGlobalStyle( 'typography.fontWeight' );
	const [ fontFamily = 'serif' ] = useGlobalStyle( 'typography.fontFamily' );
	const [ headingFontFamily = fontFamily ] = useGlobalStyle(
		'elements.h1.typography.fontFamily'
	);
	const [ headingFontWeight = fontWeight ] = useGlobalStyle(
		'elements.h1.typography.fontWeight'
	);
	const [ textColor = 'black' ] = useGlobalStyle( 'color.text' );
	const [ headingColor = textColor ] = useGlobalStyle(
		'elements.h1.color.text'
	);

	const { paletteColors } = useStylesPreviewColors();

	const FirstFrame = ( ratio ) => (
		<HStack
			spacing={ 10 * ratio }
			justify="center"
			style={ {
				height: '100%',
				overflow: 'hidden',
			} }
		>
			<PreviewTypography
				fontSize={ 65 * ratio }
				variation={ variation }
			/>
			<VStack spacing={ 4 * ratio }>
				<PreviewHighlightedColors
					normalizedColorSwatchSize={ 32 }
					ratio={ ratio }
				/>
			</VStack>
		</HStack>
	);
	const MidFrame = () => (
		<HStack
			spacing={ 0 }
			justify="flex-start"
			style={ {
				height: '100%',
				overflow: 'hidden',
			} }
		>
			{ paletteColors.slice( 0, 4 ).map( ( { color }, index ) => (
				<div
					key={ index }
					style={ {
						height: '100%',
						background: color,
						flexGrow: 1,
					} }
				/>
			) ) }
		</HStack>
	);

	const SecondFrame = ( ratio ) => (
		<VStack
			spacing={ 3 * ratio }
			justify="center"
			style={ {
				height: '100%',
				overflow: 'hidden',
				padding: 10 * ratio,
				boxSizing: 'border-box',
			} }
		>
			{ label && (
				<div
					style={ {
						fontSize: 40 * ratio,
						fontFamily: headingFontFamily,
						color: headingColor,
						fontWeight: headingFontWeight,
						lineHeight: '1em',
						textAlign: 'center',
					} }
				>
					{ label }
				</div>
			) }
		</VStack>
	);

	return (
		<PreviewWrapper
			label={ label }
			isFocused={ isFocused }
			withHoverView={ withHoverView }
			firstFrame={ FirstFrame }
			midFrame={ MidFrame }
			secondFrame={ SecondFrame }
		/>
	);
};

export default StylesPreview;
