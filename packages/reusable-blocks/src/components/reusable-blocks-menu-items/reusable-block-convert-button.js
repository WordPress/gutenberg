/**
 * WordPress dependencies
 */
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useState } from '@wordpress/element';
import {
	MenuItem,
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	ToggleControl,
} from '@wordpress/components';
import { symbol } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store } from '../../store';

/**
 * Menu control to convert block(s) to reusable block.
 *
 * @param {Object}   props              Component props.
 * @param {string[]} props.clientIds    Client ids of selected blocks.
 * @param {string}   props.rootClientId ID of the currently selected top-level block.
 * @param {()=>void} props.onClose      Callback to close the menu.
 * @return {import('react').ComponentType} The menu control or null.
 */
export default function ReusableBlockConvertButton( {
	clientIds,
	rootClientId,
	onClose,
} ) {
	const [ syncType, setSyncType ] = useState( undefined );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const canConvert = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const {
				getBlocksByClientId,
				canInsertBlockType,
				getBlockRootClientId,
			} = select( blockEditorStore );

			const rootId =
				rootClientId ||
				( clientIds.length > 0
					? getBlockRootClientId( clientIds[ 0 ] )
					: undefined );

			const blocks = getBlocksByClientId( clientIds ) ?? [];

			const isReusable =
				blocks.length === 1 &&
				blocks[ 0 ] &&
				isReusableBlock( blocks[ 0 ] ) &&
				!! select( coreStore ).getEntityRecord(
					'postType',
					'wp_block',
					blocks[ 0 ].attributes.ref
				);

			const _canConvert =
				// Hide when this is already a reusable block.
				! isReusable &&
				// Hide when reusable blocks are disabled.
				canInsertBlockType( 'core/block', rootId ) &&
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
				// Blocks refers to the wp_block post type, this checks the ability to create a post of that type.
				!! canUser( 'create', {
					kind: 'postType',
					name: 'wp_block',
				} );

			return _canConvert;
		},
		[ clientIds, rootClientId ]
	);

	const { __experimentalConvertBlocksToReusable: convertBlocksToReusable } =
		useDispatch( store );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const onConvert = useCallback(
		async function ( reusableBlockTitle ) {
			try {
				await convertBlocksToReusable(
					clientIds,
					reusableBlockTitle,
					syncType
				);
				createSuccessNotice(
					! syncType
						? sprintf(
								// translators: %s: the name the user has given to the pattern.
								__( 'Synced pattern created: %s' ),
								reusableBlockTitle
						  )
						: sprintf(
								// translators: %s: the name the user has given to the pattern.
								__( 'Unsynced pattern created: %s' ),
								reusableBlockTitle
						  ),
					{
						type: 'snackbar',
						id: 'convert-to-reusable-block-success',
					}
				);
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
					id: 'convert-to-reusable-block-error',
				} );
			}
		},
		[
			convertBlocksToReusable,
			clientIds,
			syncType,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	if ( ! canConvert ) {
		return null;
	}

	return (
		<>
			<MenuItem icon={ symbol } onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Create pattern' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Create pattern' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
						setTitle( '' );
					} }
					overlayClassName="reusable-blocks-menu-items__convert-modal"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							onConvert( title );
							setIsModalOpen( false );
							setTitle( '' );
							onClose();
						} }
					>
						<VStack spacing="5">
							<TextControl
								// TODO: Switch to `true` (40px size) if possible
								__next40pxDefaultSize={ false }
								__nextHasNoMarginBottom
								label={ __( 'Name' ) }
								value={ title }
								onChange={ setTitle }
								placeholder={ __( 'My pattern' ) }
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ _x( 'Synced', 'pattern (singular)' ) }
								help={ __(
									'Sync this pattern across multiple locations.'
								) }
								checked={ ! syncType }
								onChange={ () => {
									setSyncType(
										! syncType ? 'unsynced' : undefined
									);
								} }
							/>
							<HStack justify="right">
								<Button
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
										setTitle( '' );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button variant="primary" type="submit">
									{ __( 'Create' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
