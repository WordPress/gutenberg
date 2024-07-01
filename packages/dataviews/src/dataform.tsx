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
	item: Item;
	onUpdateItem: ( item: Item ) => void;
	fields: NormalizedField< Item >[]; // TODO: use Field. Normalize them first.
	form: {
		closeForm: () => void;
		isBusy: boolean;
		onSubmitLabel?: string;
		onCancelLabel?: string;
	};
};

export default function DataForm< Item >( {
	item: data,
	onUpdateItem,
	fields,
	form: { closeForm, isBusy, onCancelLabel, onSubmitLabel },
}: DataFormProps< Item > ) {
	const [ item, setItem ] = useState( data );
	const onSubmit: FormEventHandler< HTMLFormElement > = useCallback(
		( event ) => {
			event.preventDefault();

			onUpdateItem( item );
		},
		[ item ]
	);

	// TODO: make it work for all fields.
	const onChange = useCallback( ( title: string ) => {
		setItem( { ...item, title } );
	}, [] );

	const components = useMemo(
		() =>
			fields.map( ( field ) => {
				if ( field.type === 'text' ) {
					return (
						<TextControl
							label={ field.header }
							onChange={ onChange }
							placeholder={ field.placeholder }
							value={ field.getValue( { item } ) }
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
