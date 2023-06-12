/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ConvertToRegularBlocks from './convert-to-regular';
import ConvertToTemplatePart from './convert-to-template-part';

export default function TemplatePartConverter() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => (
				<TemplatePartConverterMenuItem
					clientIds={ selectedClientIds }
					onClose={ onClose }
				/>
			) }
		</BlockSettingsMenuControls>
	);
}

function TemplatePartConverterMenuItem( { clientIds, onClose } ) {
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);

	// Allow converting a single template part to standard blocks.
	if ( blocks.length === 1 && blocks[ 0 ]?.name === 'core/template-part' ) {
		return (
			<ConvertToRegularBlocks
				clientId={ clientIds[ 0 ] }
				onClose={ onClose }
			/>
		);
	}
	return <ConvertToTemplatePart clientIds={ clientIds } blocks={ blocks } />;
}
