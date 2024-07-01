/**
 * External dependencies
 */
import type { FormEventHandler } from 'react'; // TODO: how to import FormEventHandler?

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
	onSubmit: FormEventHandler;
	closeForm: any;
	isBusy: any;
};

export default function DataForm( {
	title,
	setTitle,
	onSubmit,
	closeForm,
	isBusy,
}: DataFormProps ) {
	return (
		<form onSubmit={ onSubmit }>
			<VStack spacing={ 3 }>
				<TextControl
					label={ __( 'Title' ) }
					onChange={ setTitle }
					placeholder={ __( 'No title' ) }
					value={ title }
				/>
				<HStack spacing={ 2 } justify="end">
					<Button variant="tertiary" onClick={ closeForm }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						type="submit"
						isBusy={ isBusy }
						aria-disabled={ isBusy }
					>
						{ _x( 'Duplicate', 'action label' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}
