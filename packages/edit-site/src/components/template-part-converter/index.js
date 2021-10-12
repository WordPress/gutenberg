/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ConvertToRegularBlocks from './convert-to-regular';
import ConvertToTemplatePart from './convert-to-template-part';

export default function TemplatePartConverter() {
	const { clientIds, blocks } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds, getBlocksByClientId } = select(
			blockEditorStore
		);
		const selectedBlockClientIds = getSelectedBlockClientIds();
		return {
			clientIds: selectedBlockClientIds,
			blocks: getBlocksByClientId( selectedBlockClientIds ),
		};
	}, [] );

	// Allow converting a single template part to standard blocks.
	if ( blocks.length === 1 && blocks[ 0 ]?.name === 'core/template-part' ) {
		return <ConvertToRegularBlocks clientId={ clientIds[ 0 ] } />;
	}

	return <ConvertToTemplatePart clientIds={ clientIds } blocks={ blocks } />;
}
