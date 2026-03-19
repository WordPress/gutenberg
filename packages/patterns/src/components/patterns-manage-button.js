/**
 * WordPress dependencies
 */
import {
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import { unlock } from '../lock-unlock';

function PatternsManageButton( { clientId, onClose } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const {
		attributes,
		canDetach,
		isVisible,
		managePatternsUrl,
		isSyncedPattern,
		isUnsyncedPattern,
		canEdit,
	} = useSelect(
		( select ) => {
			const { canRemoveBlock, getBlock, canEditBlock } =
				select( blockEditorStore );
			const { canUser } = select( coreStore );
			const block = getBlock( clientId );

			const _isUnsyncedPattern =
				!! block?.attributes?.metadata?.patternName;

			const _isSyncedPattern =
				!! block &&
				isReusableBlock( block ) &&
				!! canUser( 'update', {
					kind: 'postType',
					name: 'wp_block',
					id: block.attributes.ref,
				} );

			return {
				attributes: block.attributes,
				canEdit: canEditBlock( clientId ),
				// For unsynced patterns, detaching is simply removing the `patternName` attribute.
				// For synced patterns, the `core:block` block is replaced with its inner blocks,
				// so checking whether `canRemoveBlock` is possible is required.
				canDetach:
					_isUnsyncedPattern ||
					( _isSyncedPattern && canRemoveBlock( clientId ) ),
				isUnsyncedPattern: _isUnsyncedPattern,
				isSyncedPattern: _isSyncedPattern,
				isVisible: _isUnsyncedPattern || _isSyncedPattern,
				// The site editor and templates both check whether the user
				// has edit_theme_options capabilities. We can leverage that here
				// and omit the manage patterns link if the user can't access it.
				managePatternsUrl: canUser( 'create', {
					kind: 'postType',
					name: 'wp_template',
				} )
					? addQueryArgs( 'site-editor.php', {
							p: '/pattern',
					  } )
					: addQueryArgs( 'edit.php', {
							post_type: 'wp_block',
					  } ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Ignore reason: false positive of the lint rule.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { convertSyncedPatternToStatic } = unlock(
		useDispatch( patternsStore )
	);

	if ( ! isVisible || ! canEdit ) {
		return null;
	}

	const handleDetach = () => {
		if ( isSyncedPattern ) {
			convertSyncedPatternToStatic( clientId );
		}

		if ( isUnsyncedPattern ) {
			const { patternName, ...attributesWithoutPatternName } =
				attributes?.metadata ?? {};
			updateBlockAttributes( clientId, {
				metadata: attributesWithoutPatternName,
			} );
		}
		onClose?.();
		setShowConfirmDialog( false );
	};

	return (
		<>
			{ canDetach && (
				<>
					<MenuItem onClick={ () => setShowConfirmDialog( true ) }>
						{ isSyncedPattern
							? __( 'Disconnect pattern' )
							: __( 'Detach pattern' ) }
					</MenuItem>
					<ConfirmDialog
						isOpen={ showConfirmDialog }
						onConfirm={ handleDetach }
						onCancel={ () => setShowConfirmDialog( false ) }
						confirmButtonText={
							isSyncedPattern
								? __( 'Disconnect' )
								: __( 'Detach' )
						}
						size="medium"
						title={
							isSyncedPattern
								? __( 'Disconnect pattern?' )
								: __( 'Detach pattern?' )
						}
						__experimentalHideHeader={ false }
					>
						{ isSyncedPattern
							? __(
									'The blocks will be separated from the original pattern and will be fully editable. Future changes to the pattern will not apply here.'
							  )
							: __(
									'Blocks will no longer be associated with this pattern and will be fully editable.'
							  ) }
					</ConfirmDialog>
				</>
			) }
			<MenuItem href={ managePatternsUrl }>
				{ __( 'Manage patterns' ) }
			</MenuItem>
		</>
	);
}

export default PatternsManageButton;
