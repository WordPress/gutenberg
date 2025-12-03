/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { openBreakpointsModal } from './modal-manager';

export default function BlockVisibilityBreakpointsMenuItem( {
	clientIds,
	onClose,
} ) {
	const blocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlocksByClientId( clientIds );
		},
		[ clientIds ]
	);

	const hasBreakpointVisibility = blocks.some(
		( block ) =>
			block.attributes.metadata?.blockVisibilityBreakpoints &&
			( block.attributes.metadata.blockVisibilityBreakpoints.mobile ||
				block.attributes.metadata.blockVisibilityBreakpoints.tablet ||
				block.attributes.metadata.blockVisibilityBreakpoints.desktop )
	);

	const handleClick = () => {
		// Open modal via manager (rendered at provider level)
		openBreakpointsModal( clientIds );
		// Close menu
		if ( onClose ) {
			onClose();
		}
	};

	return (
		<MenuItem onClick={ handleClick } aria-haspopup="dialog">
			{ hasBreakpointVisibility
				? __( 'Edit breakpoint visibility' )
				: __( 'Hide block' ) }
		</MenuItem>
	);
}
