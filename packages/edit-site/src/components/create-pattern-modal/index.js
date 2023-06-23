/**
 * WordPress dependencies
 */
import {
	TextControl,
	Button,
	Modal,
	ToggleControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SYNC_TYPES, USER_PATTERN_CATEGORY } from '../page-library/utils';

export default function CreatePatternModal( {
	closeModal,
	onCreate,
	onError,
} ) {
	const [ name, setName ] = useState( '' );
	const [ syncType, setSyncType ] = useState( SYNC_TYPES.full );
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	const onSyncChange = () => {
		setSyncType(
			syncType === SYNC_TYPES.full ? SYNC_TYPES.unsynced : SYNC_TYPES.full
		);
	};

	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	async function createPattern() {
		if ( ! name ) {
			createErrorNotice( __( 'Please enter a pattern name.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			const pattern = await saveEntityRecord(
				'postType',
				'wp_block',
				{
					title: name || __( 'Untitled Pattern' ),
					content: '',
					status: 'publish',
					meta: { sync_status: syncType },
				},
				{ throwOnError: true }
			);

			onCreate( { pattern, categoryId: USER_PATTERN_CATEGORY } );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the pattern.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
			onError();
		}
	}

	return (
		<Modal
			title={ __( 'Create pattern' ) }
			onRequestClose={ closeModal }
			overlayClassName="edit-site-create-pattern-modal"
		>
			<p>{ __( 'Turn this block into a pattern to reuse later' ) }</p>

			<form
				onSubmit={ async ( event ) => {
					event.preventDefault();
					if ( ! name ) {
						return;
					}
					setIsSubmitting( true );
					await createPattern();
				} }
			>
				<VStack spacing="4">
					<TextControl
						className="edit-site-create-pattern-modal__input"
						label={ __( 'Name' ) }
						onChange={ setName }
						placeholder={ __( 'My pattern' ) }
						required
						value={ name }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Synced' ) }
						onChange={ onSyncChange }
						help={
							syncType === SYNC_TYPES.full
								? __( 'Content is synced' )
								: __( 'Content is not synced' )
						}
						checked={ syncType === SYNC_TYPES.full }
					/>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! name }
							isBusy={ isSubmitting }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
