/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	FlexItem,
	Modal,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function NavigationMenuNameModal( {
	title,
	finishButtonText = __( 'Create' ),
	onFinish,
	onRequestClose,
	value = '',
} ) {
	const [ name, setName ] = useState( value );

	return (
		<Modal
			title={ title }
			closeLabel={ __( 'Cancel' ) }
			onRequestClose={ onRequestClose }
			overlayClassName="wp-block-template-part__placeholder-create-new__title-form"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					onFinish( name );
				} }
			>
				<TextControl
					label={ __( 'Name' ) }
					value={ name }
					onChange={ setName }
				/>
				<Flex
					className="wp-block-template-part__placeholder-create-new__title-form-actions"
					justify="flex-end"
				>
					<FlexItem>
						<Button
							variant="secondary"
							onClick={ () => {
								onRequestClose();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! name.length }
							aria-disabled={ ! name.length }
						>
							{ finishButtonText }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}
