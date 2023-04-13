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
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../private-apis';

const { useHasDimensionsPanel, useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenLayout( { name, variation = '' } ) {
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const variationClassName = getVariationClassName( variation );
	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasDimensionsPanel && (
				<DimensionsPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenLayout;
