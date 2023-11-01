/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Returns the class names used for block moving mode.
 *
 * @param {string} clientId The block client ID to insert above.
 *
 * @return {string} The class names.
 */
export function useBlockMovingModeClassNames( clientId ) {
	return useSelect(
		( select ) => {
			const {
				hasBlockMovingClientId,
				canInsertBlockType,
				getBlockName,
				getBlockRootClientId,
				isBlockSelected,
			} = select( blockEditorStore );

			// The classes are only relevant for the selected block. Avoid
			// re-rendering all blocks!
			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			const movingClientId = hasBlockMovingClientId();

			if ( ! movingClientId ) {
				return;
			}

			return classnames( 'is-block-moving-mode', {
				'can-insert-moving-block': canInsertBlockType(
					getBlockName( movingClientId ),
					getBlockRootClientId( clientId )
				),
			} );
		},
		[ clientId ]
	);
}
