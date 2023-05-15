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
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';

function FontVariant ( { variantName, checked, onClick } ) {

    const { demoText } = useContext( FontLibraryContext );

    return (
        <div className="font-variant">
            <VStack spacing={ 2 }>
                <HStack justify='flex-start'>
                    <CheckboxControl checked={ checked } onChange={ onClick } />
                    <Text>{variantName}</Text>
                </HStack>
                <Text>{ demoText }</Text>
            </VStack>
        </div>

    )
}

export default FontVariant;
