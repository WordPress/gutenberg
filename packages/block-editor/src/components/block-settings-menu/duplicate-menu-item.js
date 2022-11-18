/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { useBlockSettingsContext, noop } from './block-settings-dropdown';

export function DuplicateMenuItem( { onClose } ) {
	const { __experimentalSelectBlock, shortcuts, onDuplicate, canDuplicate } =
		useBlockSettingsContext();

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
			shortcut={ shortcuts.duplicate }
		>
			{ __( 'Duplicate' ) }
		</MenuItem>
	);
}
