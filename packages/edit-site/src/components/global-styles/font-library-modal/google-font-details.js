/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import GoogleFontVariant from './google-font-variant';

function GoolgeFontDetails( { font, toggleAddFont, isFontAdded } ) {
	return (
		<>
			<Spacer margin={ 8 } />
			<VStack spacing={ 4 }>
				{ font.fontFace.map( ( face, i ) => (
					<GoogleFontVariant
						font={ font }
						fontFace={ face }
						key={ `variant${ i }` }
						toggleAddFont={ toggleAddFont }
						isFontAdded={ isFontAdded }
					/>
				) ) }
			</VStack>
		</>
	);
}

export default GoolgeFontDetails;
