/**
 * WordPress dependencies
 */
import { CheckboxControl, Flex } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';

/**
 * Internal dependencies
 */
import FontFaceDemo from './font-demo';

function CollectionFontVariant( {
	face,
	font,
	handleToggleVariant,
	selected,
} ) {
	const handleToggleActivation = () => {
		if ( font?.fontFace ) {
			handleToggleVariant( font, face );
			return;
		}
		handleToggleVariant( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );

	return (
		<div className="font-library-modal__library-font-variant">
			<Flex justify="space-between" align="center" gap="1rem">
				<FontFaceDemo fontFace={ face } text={ displayName } />
				<CheckboxControl
					checked={ selected }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom={ true }
				/>
			</Flex>
		</div>
	);
}

export default CollectionFontVariant;
