/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { CheckboxControl, Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';
import { FontLibraryContext } from './context';
import FontFaceDemo from './font-demo';

function LibraryFontVariant( { face, font } ) {
	const { isFontActivated, toggleActivateFont } =
		useContext( FontLibraryContext );

	const isInstalled =
		font?.fontFace?.length > 0
			? isFontActivated(
					font.slug,
					face.fontStyle,
					face.fontWeight,
					font.source
			  )
			: isFontActivated( font.slug, null, null, font.source );

	const handleToggleActivation = () => {
		if ( font?.fontFace?.length > 0 ) {
			toggleActivateFont( font, face );
			return;
		}
		toggleActivateFont( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );

	return (
		<div className="font-library-modal__library-font-variant">
			<Flex justify="flex-start" align="center" gap="1rem">
				<CheckboxControl
					checked={ isInstalled }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom={ true }
					label={ displayName }
				/>
				<FontFaceDemo
					fontFace={ face }
					text={ displayName }
					onClick={ handleToggleActivation }
				/>
			</Flex>
		</div>
	);
}

export default LibraryFontVariant;
