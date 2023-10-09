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
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { CATEGORY_SLUG } from './category-selector';

const usePatternCategory = ( categoryId ) => {
	return useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'taxonomy',
				CATEGORY_SLUG,
				categoryId
			);
			const hasResolvedRecord = select( coreStore ).hasFinishedResolution(
				'getEditedEntityRecord',
				[ 'taxonomy', CATEGORY_SLUG, categoryId ]
			);

			return {
				category: record,
				hasResolved: hasResolvedRecord,
			};
		},
		[ categoryId ]
	);
};

export default function RenamePatternCategoryModal( { categoryId, onClose } ) {
	const { category, hasResolved } = usePatternCategory( categoryId );
	const [ name, setName ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		if ( hasResolved && category?.name ) {
			setName( decodeEntities( category.name ) );
		}
	}, [ hasResolved, category?.name ] );

	const {
		editEntityRecord,
		invalidateResolution,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	async function onRename( event ) {
		event.preventDefault();

		if ( ! name || name === category.name || isSaving ) {
			return;
		}
		try {
			setIsSaving( true );

			await editEntityRecord( 'taxonomy', CATEGORY_SLUG, categoryId, {
				name,
			} );

			setName( '' );
			onClose?.();

			await saveSpecifiedEntityEdits(
				'taxonomy',
				CATEGORY_SLUG,
				categoryId,
				[ 'name' ],
				{ throwOnError: true }
			);

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
