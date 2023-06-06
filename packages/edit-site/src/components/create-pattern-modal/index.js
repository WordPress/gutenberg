/**
 * WordPress dependencies
 */
import {
	TextControl,
	Button,
	Modal,
	SelectControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default function CreatePatternModal( { closeModal, onCreate } ) {
	const [ name, setName ] = useState( '' );
	const [ categoryId, setCategoryId ] = useState( '' );
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	const { records: categories } = useEntityRecords(
		'taxonomy',
		'wp_pattern',
		{ per_page: -1, hide_empty: false, context: 'view' }
	);

	const options = ( categories || [] )
		.map( ( category ) => ( {
			label: category.name,
			value: category.id,
		} ) )
		.concat( [
			{ value: '', label: __( 'Select a category' ), disabled: true },
		] );

	return (
		<Modal
			title={ __( 'Create a pattern' ) }
			onRequestClose={ closeModal }
			overlayClassName="edit-site-create-pattern-modal"
		>
			<p>
				{ __(
					'Turn this block into a pattern for you to reuse later'
				) }
			</p>

			<form
				onSubmit={ async ( event ) => {
					event.preventDefault();
					if ( ! name ) {
						return;
					}
					setIsSubmitting( true );
					await onCreate( { name, categoryId } );
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
					<SelectControl
						label={ __( 'Category' ) }
						onChange={ setCategoryId }
						options={ options }
						size="__unstable-large"
						value={ categoryId }
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
							disabled={ ! name || ! categoryId }
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
