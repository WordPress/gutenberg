/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	CheckboxControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontFaceDemo from './font-demo';

function FontVariant( { fontFace, variantName, checked, onClick } ) {
	const { fontStyle, fontWeight } = fontFace;
	const displayVariantName = variantName || `${ fontWeight } ${ fontStyle }`;

	return (
		<div className="font-library-modal__font-variant">
			<VStack spacing={ 1 }>
				<HStack justify="flex-start" alignment="top">
					<CheckboxControl checked={ checked } onChange={ onClick } />
					<Text>{ displayVariantName }</Text>
				</HStack>
				<FontFaceDemo fontFace={ fontFace } />
			</VStack>
		</div>
	);
}

export default FontVariant;
