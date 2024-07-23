/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';

const meta = {
	title: 'DataViews/DataForm',
	component: DataForm,
};
export default meta;

const fields = [
	{
		id: 'title',
		label: 'Title',
		type: 'text' as const,
	},
];

export const Default = () => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
	} );

	const form = {
		visibleFields: [ 'title' ],
	};

	return (
		<DataForm
			data={ post }
			fields={ fields }
			form={ form }
			onChange={ setPost }
		/>
	);
};
