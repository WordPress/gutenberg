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
import SpacingsCount from './spacing/spacings-count';
import { hasAvailableSpacingSizes } from './spacing/utils';
import { unlock } from '../../lock-unlock';

const { useHasDimensionsPanel, useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenLayout() {
	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasSpacingSizes = hasAvailableSpacingSizes( settings );

	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			<>
				{ hasDimensionsPanel && <DimensionsPanel /> }
				{ hasSpacingSizes && (
					<div className="edit-site-global-styles-screen">
						<SpacingsCount />
					</div>
				) }
			</>
		</>
	);
}

export default ScreenLayout;
