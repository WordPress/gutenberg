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
	{
		id: 'status',
		label: 'Status',
		type: 'text' as const,
		elements: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'published', label: 'Published' },
		],
	},
];

export const Default = () => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
	} );

	const form = {
		fields: [ 'title', 'order', 'author', 'status' ],
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
