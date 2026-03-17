/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import { PrivateInspectorControlsAllowedBlocks } from '../inspector-controls/groups';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const AdvancedControls = ( { initialOpen = false } ) => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const privateFills = useSlotFills(
		PrivateInspectorControlsAllowedBlocks.name
	);

	const isContentOnlyMode = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlockEditingMode } = unlock(
			select( blockEditorStore )
		);

		const clientId = getSelectedBlockClientId();

		if ( ! clientId ) {
			return false;
		}

		return getBlockEditingMode( clientId ) === 'contentOnly';
	}, [] );

	const hasFills = Boolean( fills && fills.length );
	const hasPrivateFills = Boolean( privateFills && privateFills.length );

	if ( ! hasFills && ! hasPrivateFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ initialOpen }
		>
			{ ! isContentOnlyMode && (
				<InspectorControls.Slot group="advanced" />
			) }
			<PrivateInspectorControlsAllowedBlocks.Slot />
		</PanelBody>
	);
};

export default AdvancedControls;
