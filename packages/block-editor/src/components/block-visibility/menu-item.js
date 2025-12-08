/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { openBreakpointsModal } from '../block-visibility-breakpoints/modal-manager';
import { hasAnyBreakpointVisibility } from '../block-visibility-breakpoints/constants';

export default function BlockVisibilityMenuItem( { clientIds, onClose } ) {
	const blocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlocksByClientId( clientIds );
		},
		[ clientIds ]
	);

	const hasHiddenBlock = blocks.some(
		( block ) => block.attributes.metadata?.blockVisibility === false
	);

	const hasBreakpointVisibility = blocks.some( ( block ) =>
		hasAnyBreakpointVisibility(
			block.attributes.metadata?.blockVisibilityBreakpoints
		)
	);

	const handleClick = () => {
		openBreakpointsModal( clientIds );
		if ( onClose ) {
			onClose();
		}
	};

	return (
		<MenuItem
			icon={ hasHiddenBlock || hasBreakpointVisibility ? seen : unseen }
			onClick={ handleClick }
			aria-haspopup="dialog"
		>
			{ hasHiddenBlock || hasBreakpointVisibility
				? __( 'Show' )
				: __( 'Hide' ) }
		</MenuItem>
	);
}
