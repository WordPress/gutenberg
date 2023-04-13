/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BorderPanel from './border-panel';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../private-apis';

const { useHasBorderPanel, useGlobalSetting, useSettingsForBlockElement } =
	unlock( blockEditorPrivateApis );

function ScreenBorder( { name, variation = '' } ) {
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );
	const hasBorderPanel = useHasBorderPanel( settings );
	const variationClassName = getVariationClassName( variation );
	return (
		<>
			<ScreenHeader title={ __( 'Border' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasBorderPanel && (
				<BorderPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenBorder;
