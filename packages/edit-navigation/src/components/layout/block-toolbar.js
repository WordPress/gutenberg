/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';

export default function NavigationEditorBlockToolbar( { isFixed } ) {
	return (
		<>
			<Popover.Slot name="block-toolbar" />
			{ isFixed && (
				<div className="edit-navigation-layout__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</>
	);
}
