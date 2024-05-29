/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DimensionsPanel from './dimensions-panel';
import BackgroundPanel from './background-panel';
import ScreenHeader from './header';
import { unlock } from '../../lock-unlock';

const {
	useHasBackgroundPanel,
	useHasDimensionsPanel,
	useGlobalSetting,
	useSettingsForBlockElement,
} = unlock( blockEditorPrivateApis );

function ScreenLayout() {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			{ hasDimensionsPanel && <DimensionsPanel /> }
			{ hasBackgroundPanel && <BackgroundPanel /> }
		</>
	);
}

export default ScreenLayout;
