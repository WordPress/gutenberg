/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
    Button,
    __experimentalHStack as HStack,
} from '@wordpress/components';


/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';

function LocalFonts () {

    const Footer = () => {
		return (
			<HStack justify="flex-end">
				<Button variant="primary" disabled={ true }>
					{ __("Upload Fonts") }
				</Button>
			</HStack>
		);
	}


    return (
        <TabLayout
            description={ __("Install Local Fonts") }
            footer={ <Footer /> }
        >
            
		</TabLayout>
    );
}

export default LocalFonts;
