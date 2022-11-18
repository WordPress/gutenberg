/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { BlockSettingsDropdownContext } from './block-settings-dropdown';

export function MoveMenuItem( { onClose } ) {
	const { onMoveTo, canMove, blockClientIds } = useContext(
		BlockSettingsDropdownContext
	);

	const firstBlockClientId = blockClientIds[ 0 ];

	const { onlyBlock } = useSelect(
		( select ) => {
			const { getBlockCount, getBlockRootClientId } =
				select( blockEditorStore );

			const _firstParentClientId =
				getBlockRootClientId( firstBlockClientId );

			return {
				onlyBlock: 1 === getBlockCount( _firstParentClientId ),
			};
		},
		[ firstBlockClientId ]
	);

	if ( ! canMove || onlyBlock ) {
		return null;
	}

	return (
		<MenuItem onClick={ pipe( onClose, onMoveTo ) }>
			{ __( 'Move to' ) }
		</MenuItem>
	);
}
