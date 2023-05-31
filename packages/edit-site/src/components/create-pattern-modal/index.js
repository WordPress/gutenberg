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
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import usePatternCategories from '../sidebar-navigation-screen-library/use-pattern-categories';

export default function CreatePatternModal( { closeModal, onCreate } ) {
	const [ name, setName ] = useState( '' );
	const [ categoryName, setCategoryName ] = useState( '' );
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	const { patternCategories } = usePatternCategories();

	const options = patternCategories.map( ( category ) => ( {
		label: category.label,
		value: category.name,
	} ) );

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
					await onCreate( { name } );
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
						onChange={ setCategoryName }
						options={ options }
						size="__unstable-large"
						value={ categoryName }
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
