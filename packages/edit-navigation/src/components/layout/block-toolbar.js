/**
 * WordPress dependencies
 */
import {
	BlockToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function NavigationEditorBlockToolbar( { isFixed } ) {
	const isNavigationMode = useSelect(
		( select ) => select( blockEditorStore ).isNavigationMode(),
		[]
	);
	return (
		<>
			<Popover.Slot name="block-toolbar" />
			{ isFixed && (
				<div className="edit-navigation-layout__block-toolbar">
					{ ! isNavigationMode && <BlockToolbar hideDragHandle /> }
				</div>
			) }
		</>
	);
}
