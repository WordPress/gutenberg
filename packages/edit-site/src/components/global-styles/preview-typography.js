/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TypographyExample from './typography-example';
import PreviewIframe from './preview-iframe';

const StylesPreviewTypography = ( { variation, isFocused, withHoverView } ) => {
	return (
		<PreviewIframe
			label={ variation.title }
			isFocused={ isFocused }
			withHoverView={ withHoverView }
		>
			{ ( { ratio, key } ) => (
				<HStack
					key={ key }
					spacing={ 10 * ratio }
					justify="center"
					style={ {
						height: '100%',
						overflow: 'hidden',
					} }
				>
					<TypographyExample
						variation={ variation }
						fontSize={ 85 * ratio }
					/>
				</HStack>
			) }
		</PreviewIframe>
	);
};

export default StylesPreviewTypography;
