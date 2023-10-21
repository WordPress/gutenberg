/**
 * WordPress dependencies
 */
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	CheckboxControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontFaceDemo from './font-demo';

function FontVariant( {
	fontFace,
	variantName,
	checked,
	onClick,
	text,
	actionHandler,
} ) {
	const { fontStyle, fontWeight } = fontFace;
	const displayVariantName = variantName || `${ fontWeight } ${ fontStyle }`;

	return (
		<div className="font-library-modal__font-variant">
			<VStack spacing={ 1 }>
				<HStack justify="flex-start" alignment="top">
					{ !! actionHandler ? (
						actionHandler
					) : (
						<CheckboxControl
							checked={ checked }
							onChange={ onClick }
						/>
					) }
					{ typeof displayVariantName === 'string' ? (
						<Text>{ displayVariantName }</Text>
					) : (
						displayVariantName
					) }
				</HStack>
				<div className="font-library-modal__font-variant_demo-wrapper">
					<FontFaceDemo fontFace={ fontFace } text={ text } />
				</div>
			</VStack>
		</div>
	);
}

export default FontVariant;
