/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';


function InstalledFonts () {
    return (
        <TabLayout description={ __("Fonts installed in your WordPress, activate them to use in your site.") }>
		</TabLayout>
    );
}

export default InstalledFonts;
