/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import BackgroundPanel from './background-panel';
import ScreenHeader from './header';
import { unlock } from '../../lock-unlock';

const { useHasBackgroundPanel, useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenBackground() {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	return (
		<>
			<ScreenHeader title={ __( 'Background' ) } />
			{ hasBackgroundPanel && <BackgroundPanel /> }
		</>
	);
}

export default ScreenBackground;
