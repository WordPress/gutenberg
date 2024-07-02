/**
 * External dependencies
 */
import type { FormEventHandler } from 'react'; // TODO: how to import FormEventHandler?

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedField } from './types';

type DataFormProps< Item > = {
	data: Item;
	onUpdate: ( item: Item ) => void;
	fields: NormalizedField< Item >[]; // TODO: use Field. Normalize them first.
	form: {
		closeForm: () => void;
		isBusy: boolean;
		onSubmitLabel?: string;
		onCancelLabel?: string;
	};
};

type DataFormTextControlProps< Item > = {
	field: NormalizedField< Item >;
	item: Item;
	setItem: any; // TODO: fix type.
};

function DataFormTextControl< Item >( {
	field,
	item,
	setItem,
}: DataFormTextControlProps< Item > ) {
	const { id, header, placeholder, getValue } = field;

	const onChange = useCallback(
		( value: string ) =>
			setItem( ( prevItem: any ) => ( { ...prevItem, [ id ]: value } ) ),
		[ id, setItem ]
	);

	return (
		<TextControl
			label={ header }
			placeholder={ placeholder }
			value={ getValue( { item } ) }
			onChange={ onChange }
		/>
	);
}

export default function DataForm< Item >( {
	data,
	onUpdate,
	fields,
	form: { closeForm, isBusy, onCancelLabel, onSubmitLabel },
}: DataFormProps< Item > ) {
	const [ item, setItem ] = useState< Item >( data );
	const onSubmit: FormEventHandler< HTMLFormElement > = useCallback(
		( event ) => {
			event.preventDefault();

			onUpdate( item );
		},
		[ item ]
	);

	const components = useMemo(
		() =>
			fields.map( ( field ) => {
				if ( field.type === 'text' ) {
					return (
						<DataFormTextControl
							field={ field }
							item={ item }
							setItem={ setItem }
						/>
					);
				}
				return null;
			} ),
		[ fields, item ]
	);

	return (
		<form onSubmit={ onSubmit }>
			<VStack spacing={ 3 }>
				{ components }
				<HStack spacing={ 2 } justify="end">
					<Button variant="tertiary" onClick={ closeForm }>
						{ onCancelLabel || __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						type="submit"
						isBusy={ isBusy }
						aria-disabled={ isBusy }
					>
						{ onSubmitLabel || __( 'Submit' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}
