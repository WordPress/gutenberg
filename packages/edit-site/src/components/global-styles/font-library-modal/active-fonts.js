/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import { fontFamilyToCardFont } from './utils';
import { unlock } from '../../../private-apis';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );


function ActiveFonts () {
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const themeFontFamilies = fontFamilies?.theme  || [];

	const fonts = useMemo( () => (
		themeFontFamilies
			.map( fontFamilyToCardFont )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) )
	), [ themeFontFamilies ] );


    return (
        <TabLayout description={ __("Fonts available to use in your site") }>
            <FontsGrid>
				{ fonts.map( ( font ) => (
					<FontCard font={ font } key={ font.name } />
				))}
			</FontsGrid>
        </TabLayout>
    );
}

export default ActiveFonts;
