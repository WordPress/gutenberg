/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { CheckboxControl, Flex } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontFaceDemo from './font-demo';

function LibraryFontVariant( { face, font } ) {
	const { isFontActivated, toggleActivateFont } =
		useContext( FontLibraryContext );

	const isIstalled = font?.fontFace
		? isFontActivated(
				font.slug,
				face.fontStyle,
				face.fontWeight,
				font.source
		  )
		: isFontActivated( font.slug, null, null, font.source );

	const handleToggleActivation = () => {
		if ( font?.fontFace ) {
			toggleActivateFont( font, face );
			return;
		}
		toggleActivateFont( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );

	return (
		<div className="font-library-modal__library-font-variant">
			<Flex justify="space-between" align="center" gap="1rem">
				<FontFaceDemo fontFace={ face } text={ displayName } />
				<CheckboxControl
					checked={ isIstalled }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom={ true }
				/>
			</Flex>
		</div>
	);
}

export default LibraryFontVariant;
