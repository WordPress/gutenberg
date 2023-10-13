/**
 * WordPress dependencies
 */
import {
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { CATEGORY_SLUG } from './category-selector';

export default function RenamePatternCategoryModal( {
	category,
	onClose,
	onError,
	onSuccess,
	...props
} ) {
	const [ name, setName ] = useState( decodeEntities( category.name ) );
	const [ isSaving, setIsSaving ] = useState( false );

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );

	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const onRename = async ( event ) => {
		event.preventDefault();

		if ( ! name || name === category.name || isSaving ) {
			return;
		}

		try {
			setIsSaving( true );

			// User pattern category properties may differ as they can be
			// normalized for use alongside template part areas, core pattern
			// categories etc. As a result we won't just destructure the passed
			// category object.
			const savedRecord = await saveEntityRecord(
				'taxonomy',
				CATEGORY_SLUG,
				{
					id: category.id,
					slug: category.slug,
					name,
				}
			);

			invalidateResolution( 'getUserPatternCategories' );
			onSuccess?.( savedRecord );
			onClose();

			createSuccessNotice( __( 'Pattern category renamed.' ), {
				type: 'snackbar',
				id: 'pattern-category-update',
			} );
		} catch ( error ) {
			onError?.();
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: 'pattern-category-update',
			} );
		} finally {
			setIsSaving( false );
			setName( '' );
		}
	};

	const onRequestClose = () => {
		onClose();
		setName( '' );
	};

	return (
		<Modal
			title={ __( 'Rename' ) }
			onRequestClose={ onRequestClose }
			{ ...props }
		>
			<form onSubmit={ onRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ name }
						onChange={ setName }
						required
					/>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onRequestClose }>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							aria-disabled={
								! name || name === category.name || isSaving
							}
							isBusy={ isSaving }
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
