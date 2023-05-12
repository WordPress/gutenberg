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

function GoolgeFontDetails ({ font }) {
    return (
        <>
            <Spacer margin={ 8 } />
            <VStack spacing={ 4 }>
                { font.variants.map( ( variantName ) => (
                    <GoogleFontVariant
                        font={ font }
                        variantName={ variantName }
                        key={variantName}
                    />
                ) ) }
            </VStack>
        </>
    );
}

export default GoolgeFontDetails;
