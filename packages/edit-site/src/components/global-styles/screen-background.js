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

const { useHasBackgroundPanel, useGlobalSetting } = unlock(
	blockEditorPrivateApis
);

function ScreenBackground() {
	const [ settings ] = useGlobalSetting( '' );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	return (
		<>
			<ScreenHeader title={ __( 'Background' ) } />
			{ hasBackgroundPanel && <BackgroundPanel /> }
		</>
	);
}

export default ScreenBackground;
