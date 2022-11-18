/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockSettingsContext, noop } from './block-settings-dropdown';

export function DuplicateMenuItem( { onClose } ) {
	const { __experimentalSelectBlock, onDuplicate, canDuplicate } =
		useBlockSettingsContext();

	const { duplicate } = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			duplicate: getShortcutRepresentation(
				'core/block-editor/duplicate'
			),
		};
	}, [] );

	const updateSelectionAfterDuplicate = useCallback(
		__experimentalSelectBlock
			? async ( clientIdsPromise ) => {
					const ids = await clientIdsPromise;
					if ( ids && ids[ 0 ] ) {
						__experimentalSelectBlock( ids[ 0 ] );
					}
			  }
			: noop,
		[ __experimentalSelectBlock ]
	);

	if ( ! canDuplicate ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe(
				onClose,
				onDuplicate,
				updateSelectionAfterDuplicate
			) }
			shortcut={ duplicate }
		>
			{ __( 'Duplicate' ) }
		</MenuItem>
	);
}
