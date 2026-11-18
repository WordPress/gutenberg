import { useState } from '@wordpress/element';
import DataForm from '../index';
import useFormValidity from '../../hooks/use-form-validity';
import type { Field, Form } from '../../types';

type ValidatedPanelItem = {
	title: string;
};

const fields: Field< ValidatedPanelItem >[] = [
	{
		id: 'title',
		type: 'text',
		label: 'Title',
		isValid: {
			required: true,
		},
	},
];

const form: Form = {
	layout: { type: 'panel', openAs: 'dropdown' },
	fields: [ 'title' ],
};

const ValidationPanelComponent = () => {
	const [ item, setItem ] = useState< ValidatedPanelItem >( {
		title: 'Hello world',
	} );
	const { validity } = useFormValidity( item, fields, form );

	return (
		<DataForm< ValidatedPanelItem >
			data={ item }
			fields={ fields }
			form={ form }
			validity={ validity }
			onChange={ ( edits ) =>
				setItem( ( prev ) => ( { ...prev, ...edits } ) )
			}
		/>
	);
};

export default ValidationPanelComponent;
