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
	{
		id: 'order',
		label: 'Order',
		type: 'integer' as const,
	},
	{
		id: 'author',
		label: 'Author',
		type: 'integer' as const,
		elements: [
			{ value: 1, label: 'Jane' },
			{ value: 2, label: 'John' },
		],
	},
];

export const Default = () => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
	} );

	const form = {
		visibleFields: [ 'title', 'order', 'author' ],
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
