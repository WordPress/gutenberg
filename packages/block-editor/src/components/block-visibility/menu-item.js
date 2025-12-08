/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { hasAnyBreakpointVisibility } from '../block-visibility-breakpoints/constants';
import BlockVisibilityBreakpointsModal from '../block-visibility-breakpoints/modal';

export default function BlockVisibilityMenuItem( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

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
		setIsModalOpen( true );
	};

	return (
		<>
			<MenuItem
				icon={
					hasHiddenBlock || hasBreakpointVisibility ? seen : unseen
				}
				onClick={ handleClick }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ hasHiddenBlock || hasBreakpointVisibility
					? __( 'Show' )
					: __( 'Hide' ) }
			</MenuItem>
			{ isModalOpen && (
				<BlockVisibilityBreakpointsModal
					clientIds={ clientIds }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
