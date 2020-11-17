/**
 * WordPress dependencies
 */
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { reusableBlock } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_KEY } from '../../store/constants';

/**
 * Menu control to convert block(s) to reusable block.
 *
 * @param {Object}   props              Component props.
 * @param {string[]} props.clientIds    Client ids of selected blocks.
 * @param {string}   props.rootClientId ID of the currently selected top-level block.
 * @return {import('@wordpress/element').WPComponent} The menu control or null.
 */
export default function ReusableBlockConvertButton( {
	clientIds,
	rootClientId,
} ) {
	const canConvert = useSelect(
		( select ) => {
			const { canUser } = select( 'core' );
			const { getBlocksByClientId, canInsertBlockType } = select(
				'core/block-editor'
			);

			const blocks = getBlocksByClientId( clientIds ) ?? [];

			const isReusable =
				blocks.length === 1 &&
				blocks[ 0 ] &&
				isReusableBlock( blocks[ 0 ] ) &&
				!! select( 'core' ).getEntityRecord(
					'postType',
					'wp_block',
					blocks[ 0 ].attributes.ref
				);

			const _canConvert =
				// Hide when this is already a reusable block.
				! isReusable &&
				// Hide when reusable blocks are disabled.
				canInsertBlockType( 'core/block', rootClientId ) &&
				blocks.every(
					( block ) =>
						// Guard against the case where a regular block has *just* been converted.
						!! block &&
						// Hide on invalid blocks.
						block.isValid &&
						// Hide when block doesn't support being made reusable.
						hasBlockSupport( block.name, 'reusable', true )
				) &&
				// Hide when current doesn't have permission to do that.
				!! canUser( 'create', 'blocks' );

			return _canConvert;
		},
		[ clientIds ]
	);

	const {
		__experimentalConvertBlocksToReusable: convertBlocksToReusable,
	} = useDispatch( STORE_KEY );

	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);
	const onConvert = useCallback(
		async function () {
			try {
				await convertBlocksToReusable( clientIds );
				createSuccessNotice( __( 'Block created.' ), {
					type: 'snackbar',
				} );
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
				} );
			}
		},
		[ clientIds ]
	);

	if ( ! canConvert ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					icon={ reusableBlock }
					onClick={ () => {
						onConvert();
						onClose();
					} }
				>
					{ __( 'Add to Reusable blocks' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
