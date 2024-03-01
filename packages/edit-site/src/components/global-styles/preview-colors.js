/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PreviewHighlightedColors from './preview-highlighted-colors';
import PreviewWrapper from './preview-wrapper';

const StylesPreviewColors = ( { label, isFocused, withHoverView } ) => {
	const FirstFrame = ( ratio ) => (
		<HStack
			spacing={ 10 * ratio }
			justify="center"
			style={ {
				height: '100%',
				overflow: 'hidden',
			} }
		>
			<PreviewHighlightedColors
				normalizedColorSwatchSize={ 66 }
				ratio={ ratio }
			/>
		</HStack>
	);

	return (
		<PreviewWrapper
			label={ label }
			isFocused={ isFocused }
			withHoverView={ withHoverView }
			firstFrame={ FirstFrame }
		/>
	);
};

export default StylesPreviewColors;
