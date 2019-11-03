/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { EnablePanelOption } from './index';

const { Fill, Slot } = createSlotFill( 'EnablePluginDocumentSettingPanelOption' );

const EnablePluginDocumentSettingPanelOption = ( { label, panelName } ) => (
	<Fill>
		<EnablePanelOption
			label={ label }
			panelName={ panelName }
		/>
	</Fill>
);

EnablePluginDocumentSettingPanelOption.Slot = Slot;

export default EnablePluginDocumentSettingPanelOption;
