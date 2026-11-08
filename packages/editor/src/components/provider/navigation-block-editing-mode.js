/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * For the Navigation block editor, we need to force the block editor to contentOnly for that block.
 *
 * Set block editing mode to contentOnly when entering Navigation focus mode.
 * this ensures that non-content controls on the block will be hidden and thus
 * the user can focus on editing the Navigation Menu content only.
 */

export default function NavigationBlockEditingMode() {
	const registry = useRegistry();
	// In the navigation block editor,
	// the navigation block is the only root block.
	const blockClientId = useSelect(
		( select ) => select( blockEditorStore ).getBlockOrder()?.[ 0 ],
		[]
	);

	useEffect( () => {
		if ( ! blockClientId ) {
			return;
		}
		const {
			setBlockEditingMode,
			unsetBlockEditingMode,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		__unstableMarkNextChangeAsNotPersistent();
		setBlockEditingMode( blockClientId, 'contentOnly' );

		return () => {
			__unstableMarkNextChangeAsNotPersistent();
			unsetBlockEditingMode( blockClientId );
		};
	}, [ registry, blockClientId ] );
}
