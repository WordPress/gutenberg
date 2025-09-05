/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TypographyExample from './typography-example';
import PreviewWrapper from './preview-wrapper';

const StylesPreviewTypography = ( { variation, isFocused, withHoverView } ) => {
	return (
		<PreviewWrapper
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
		</PreviewWrapper>
	);
};

export default StylesPreviewTypography;
