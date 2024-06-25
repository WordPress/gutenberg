/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	CheckboxControl,
	Flex,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';
import { FontLibraryContext } from './context';
import FontDemo from './font-demo';
import { unlock } from '../../../lock-unlock';

const { kebabCase } = unlock( componentsPrivateApis );

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
	const checkboxId = kebabCase(
		`${ font.slug }-${ getFontFaceVariantName( face ) }`
	);

	return (
		<div className="font-library-modal__font-card">
			<Flex justify="flex-start" align="center" gap="1rem">
				<CheckboxControl
					checked={ isInstalled }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom
					id={ checkboxId }
				/>
				<label htmlFor={ checkboxId }>
					<FontDemo
						font={ face }
						text={ displayName }
						onClick={ handleToggleActivation }
					/>
				</label>
			</Flex>
		</div>
	);
}

export default LibraryFontVariant;
