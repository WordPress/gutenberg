/**
 * WordPress dependencies
 */
import { CheckboxControl, Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';
import FontFaceDemo from './font-demo';
import { kebabCase } from '../../../../../block-editor/src/utils/object';

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
	const checkboxId = kebabCase(
		`${ font.slug }-${ getFontFaceVariantName( face ) }`
	);

	return (
		<label
			className="font-library-modal__library-font-variant"
			htmlFor={ checkboxId }
		>
			<Flex justify="space-between" align="center" gap="1rem">
				<FontFaceDemo fontFace={ face } text={ displayName } />
				<CheckboxControl
					checked={ selected }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom={ true }
					id={ checkboxId }
					label={ false }
				/>
			</Flex>
		</label>
	);
}

export default CollectionFontVariant;
