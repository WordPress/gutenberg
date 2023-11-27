/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DimensionsPanel from './dimensions-panel';
import ScreenHeader from './header';
import { unlock } from '../../lock-unlock';

const { useHasDimensionsPanel, useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenLayout( { showBack = true } ) {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	return (
		<>
			<ScreenHeader showBack={ showBack } title={ __( 'Layout' ) } />
			{ hasDimensionsPanel && <DimensionsPanel /> }
		</>
	);
}

export default ScreenLayout;
