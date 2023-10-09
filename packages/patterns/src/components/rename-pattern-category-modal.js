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

export default function RenamePatternCategoryModal( { category, onClose } ) {
	// If the user created category has been retrieved via
	// getUserPatternCategories the name value is assigned to the label property
	// and `name` is overwritten with the slug value to match categories from
	// core, template parts etc.
	const originalName = decodeEntities( category.label || category.name );
	const [ name, setName ] = useState( originalName );
	const [ isSaving, setIsSaving ] = useState( false );

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );

	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	async function onRename( event ) {
		event.preventDefault();

		if ( ! name || name === category.name || isSaving ) {
			return;
		}

		try {
			setIsSaving( true );
			setName( '' );
			onClose?.();

			// User pattern category properties may differ as they can be
			// normalized for use alongside template part areas, core pattern
			// categories etc. As a result we won't just destructure the passed
			// category object.
			await saveEntityRecord( 'taxonomy', CATEGORY_SLUG, {
				id: category.id,
				slug: category.slug,
				name,
			} );

			invalidateResolution( 'getUserPatternCategories' );

			createSuccessNotice( __( 'Pattern category renamed.' ), {
				type: 'snackbar',
				id: 'pattern-category-update',
			} );
		} catch ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: 'pattern-category-update',
			} );
		} finally {
			setIsSaving( false );
			setName( '' );
		}
	}

	const onRequestClose = () => {
		onClose();
		setName( '' );
	};

	return (
		<Modal title={ __( 'Rename' ) } onRequestClose={ onRequestClose }>
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
