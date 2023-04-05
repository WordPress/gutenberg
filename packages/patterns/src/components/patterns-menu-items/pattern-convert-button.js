/**
 * WordPress dependencies
 */
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { useCallback, useState } from '@wordpress/element';
import {
	MenuItem,
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { symbol } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Menu control to convert block(s) to patterns.
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Client ids of selected blocks.
 * @return {import('@wordpress/element').WPComponent} The menu control or null.
 */
export default function PatternConvertButton( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );

	const convertBlocksToPattern =
		( clientIDs, _title ) =>
		async ( { registry } ) => {
			const pattern = {
				title: _title || __( 'Untitled Pattern' ),
				content: serialize(
					registry
						.select( blockEditorStore )
						.getBlocksByClientId( clientIDs )
				),
				status: 'publish',
			};

			await registry
				.dispatch( 'core' )
				.saveEntityRecord( 'postType', 'wp_block_pattern', pattern );
		};

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const onConvert = useCallback(
		async function ( patternTitle ) {
			try {
				await convertBlocksToPattern( clientIds, patternTitle );
				createSuccessNotice( __( 'Pattern created.' ), {
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

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<>
					<MenuItem
						icon={ symbol }
						onClick={ () => {
							setIsModalOpen( true );
						} }
					>
						{ __( 'Create Pattern' ) }
					</MenuItem>
					{ isModalOpen && (
						<Modal
							title={ __( 'Create Pattern' ) }
							onRequestClose={ () => {
								setIsModalOpen( false );
								setTitle( '' );
							} }
							overlayClassName="patterns-menu-items__convert-modal"
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
										__nextHasNoMarginBottom
										label={ __( 'Name' ) }
										value={ title }
										onChange={ setTitle }
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
											{ __( 'Save' ) }
										</Button>
									</HStack>
								</VStack>
							</form>
						</Modal>
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
