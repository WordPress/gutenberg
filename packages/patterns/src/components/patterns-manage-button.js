/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import { unlock } from '../lock-unlock';

function PatternsManageButton( { clientId } ) {
	const {
		attributes,
		canDetach,
		isVisible,
		managePatternsUrl,
		isSyncedPattern,
		isUnsyncedPattern,
	} = useSelect(
		( select ) => {
			const { canRemoveBlock, getBlock } = select( blockEditorStore );
			const { canUser } = select( coreStore );
			const block = getBlock( clientId );

			const _isUnsyncedPattern =
				window?.__experimentalContentOnlyPatternInsertion &&
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

	if ( ! isVisible ) {
		return null;
	}

	return (
		<>
			{ canDetach && (
				<MenuItem
					onClick={ () => {
						if ( isSyncedPattern ) {
							convertSyncedPatternToStatic( clientId );
						}

						if ( isUnsyncedPattern ) {
							const {
								patternName,
								...attributesWithoutPatternName
							} = attributes?.metadata ?? {};
							updateBlockAttributes( clientId, {
								metadata: attributesWithoutPatternName,
							} );
						}
					} }
				>
					{ __( 'Disconnect pattern' ) }
				</MenuItem>
			) }
			<MenuItem href={ managePatternsUrl }>
				{ __( 'Manage patterns' ) }
			</MenuItem>
		</>
	);
}

export default PatternsManageButton;
