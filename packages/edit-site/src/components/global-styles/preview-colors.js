/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HighlightedColors from './highlighted-colors';
import PreviewIframe from './preview-iframe';
import { FirstFrame } from './preview-animations';

const StylesPreviewColors = ( { label, isFocused, withHoverView } ) => {
	return (
		<PreviewIframe
			label={ label }
			isFocused={ isFocused }
			withHoverView={ withHoverView }
		>
			{ ( { ratio, key } ) => (
				<FirstFrame key={ key }>
					<HStack
						spacing={ 10 * ratio }
						justify="center"
						style={ {
							height: '100%',
							overflow: 'hidden',
						} }
					>
						<HighlightedColors
							normalizedColorSwatchSize={ 66 }
							ratio={ ratio }
						/>
					</HStack>
				</FirstFrame>
			) }
		</PreviewIframe>
	);
};

export default StylesPreviewColors;
