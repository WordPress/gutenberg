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
import { useCallback, useState } from '@wordpress/element';

type DataFormProps = {
	item: any;
	onUpdateItem: ( item: any ) => void;
	closeForm: any;
	isBusy: any;
};

export default function DataForm( {
	item: initialItem,
	onUpdateItem,
	closeForm,
	isBusy,
}: DataFormProps ) {
	const [ item, setItem ] = useState( initialItem );
	const onSubmit: FormEventHandler< HTMLFormElement > = useCallback(
		( event ) => {
			event.preventDefault();

			onUpdateItem( item );
		},
		[ item ]
	);

	const onChange = useCallback( ( title: string ) => {
		setItem( { ...item, title } );
	}, [] );

	return (
		<form onSubmit={ onSubmit }>
			<VStack spacing={ 3 }>
				<TextControl
					label={ __( 'Title' ) }
					onChange={ onChange }
					placeholder={ __( 'No title' ) }
					value={ item.title }
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
