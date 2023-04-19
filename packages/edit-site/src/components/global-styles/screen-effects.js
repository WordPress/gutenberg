/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../private-apis';
import EffectsPanel from './effects-panel';

const { useGlobalSetting, useSettingsForBlockElement, useHasEffectsPanel } =
	unlock( blockEditorPrivateApis );

function ScreenEffects( { name, variation = '' } ) {
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );
	const variationClassName = getVariationClassName( variation );
	const hasEffectsPanel = useHasEffectsPanel( settings );
	return (
		<>
			<ScreenHeader title={ __( 'Effects' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasEffectsPanel && (
				<EffectsPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenEffects;
