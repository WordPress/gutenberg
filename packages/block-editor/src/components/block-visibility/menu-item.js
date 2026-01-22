/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import BlockVisibilityViewportMenuItem from './viewport-menu-item';

function BlockVisibilityMenuItemDefault( { clientIds } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const blocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlocksByClientId( clientIds );
		},
		[ clientIds ]
	);

	const listViewShortcut = useSelect( ( select ) => {
		return select( keyboardShortcutsStore ).getShortcutRepresentation(
			'core/editor/toggle-list-view'
		);
	}, [] );

	const hasHiddenBlock = blocks.some(
		( block ) => block.attributes.metadata?.blockVisibility === false
	);

	const toggleBlockVisibility = () => {
		const isHiding = ! hasHiddenBlock;

		const attributesByClientId = Object.fromEntries(
			blocks?.map( ( { clientId, attributes } ) => [
				clientId,
				{
					metadata: cleanEmptyObject( {
						...attributes?.metadata,
						blockVisibility: isHiding ? false : undefined,
					} ),
				},
			] )
		);
		updateBlockAttributes( clientIds, attributesByClientId, {
			uniqueByBlock: true,
		} );

		if ( isHiding ) {
			if ( blocks.length > 1 ) {
				createSuccessNotice(
					sprintf(
						// translators: %s: The shortcut key to access the List View.
						__(
							'Blocks hidden. You can access them via the List View (%s).'
						),
						listViewShortcut
					),
					{
						id: 'block-visibility-hidden',
						type: 'snackbar',
					}
				);
			} else {
				createSuccessNotice(
					sprintf(
						// translators: %s: The shortcut key to access the List View.
						__(
							'Block hidden. You can access it via the List View (%s).'
						),
						listViewShortcut
					),
					{
						id: 'block-visibility-hidden',
						type: 'snackbar',
					}
				);
			}
		}
	};

	return (
		<MenuItem
			icon={ hasHiddenBlock ? seen : unseen }
			onClick={ toggleBlockVisibility }
		>
			{ hasHiddenBlock ? __( 'Show' ) : __( 'Hide' ) }
		</MenuItem>
	);
}

export default function BlockVisibilityMenuItem( { clientIds } ) {
	return window.__experimentalHideBlocksBasedOnScreenSize ? (
		<BlockVisibilityViewportMenuItem clientIds={ clientIds } />
	) : (
		<BlockVisibilityMenuItemDefault clientIds={ clientIds } />
	);
}
