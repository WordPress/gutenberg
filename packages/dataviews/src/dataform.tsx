/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

type DataFormProps = {
	title: any;
	setTitle: any;
	createPage: any;
	closeModal: any;
	isCreatingPage: any;
};

export default function DataForm( {
	createPage,
	title,
	setTitle,
	closeModal,
	isCreatingPage,
}: DataFormProps ) {
	return (
		<form onSubmit={ createPage }>
			<VStack spacing={ 3 }>
				<TextControl
					label={ __( 'Title' ) }
					onChange={ setTitle }
					placeholder={ __( 'No title' ) }
					value={ title }
				/>
				<HStack spacing={ 2 } justify="end">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						type="submit"
						isBusy={ isCreatingPage }
						aria-disabled={ isCreatingPage }
					>
						{ _x( 'Duplicate', 'action label' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}
