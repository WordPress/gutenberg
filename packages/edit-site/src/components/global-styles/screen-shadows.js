/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import ShadowsPanel from './shadows-panel';
import { unlock } from '../../lock-unlock';

const { useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenShadows() {
	// const [ rawSettings ] = useGlobalSetting( '' );
	// const settings = useSettingsForBlockElement( rawSettings );
	return (
		<>
			<ScreenHeader
                title={ __( 'Shadows' ) } 
                description={ __(
					'Shadows and the application of those shadows on site elements.'
				) }
            />
            <div className="edit-site-global-styles-screen">
                <ShadowsPanel />
            </div>
		</>
	);
}

export default ScreenShadows;
