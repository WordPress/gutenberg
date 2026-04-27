/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { lock, unlock } from '@wordpress/icons';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function Toolbar( {
	openDialog,
	closeDialog,
	isOpen,
	isLocked,
	toggleLock,
	clientId,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { rootClientId } = useSelect(
		( select ) => {
			return {
				rootClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);
	const buttonLabel = useMemo(
		() => ( isOpen ? __( 'Close dialog' ) : __( 'Edit dialog' ) ),
		[ isOpen ]
	);

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					label={ buttonLabel }
					onClick={ () => {
						if ( isOpen ) {
							selectBlock( rootClientId );
							closeDialog();
						} else {
							openDialog();
						}
					} }
				>
					{ buttonLabel }
				</ToolbarButton>
				{ isOpen && (
					<ToolbarButton
						icon={ isLocked ? lock : unlock }
						label={
							isLocked
								? __( 'Unlock dialog' )
								: __( 'Lock dialog open' )
						}
						isPressed={ isLocked }
						onClick={ toggleLock }
					/>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}
