/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

/**
 * Experimental dependencies
 */
const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

export default function NavigationMenu( { onSelect, navigationBlockId } ) {
	const { clientIdsTree } = useSelect(
		( select ) => {
			const { __unstableGetClientIdsTree } = select( blockEditorStore );
			return {
				clientIdsTree: __unstableGetClientIdsTree( navigationBlockId ),
			};
		},
		[ navigationBlockId ]
	);

	return (
		<>
			<OffCanvasEditor
				blocks={ clientIdsTree }
				onSelect={ onSelect }
				LeafMoreMenu={ LeafMoreMenu }
			/>
		</>
	);
}
