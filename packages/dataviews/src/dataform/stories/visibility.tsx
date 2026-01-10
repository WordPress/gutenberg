/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

const VisibilityComponent = () => {
	type Post = {
		name: string;
		email: string;
		isActive: boolean;
		homepageDisplay: string;
		staticHomepage: string;
	};
	const [ data, setData ] = useState( {
		name: '',
		email: '',
		isActive: true,
		homepageDisplay: 'latest',
		staticHomepage: '',
	} );

	const _fields: Field< Post >[] = [
		{ id: 'isActive', label: 'Is module active?', type: 'boolean' },
		{
			id: 'name',
			label: 'Name',
			type: 'text',
			isVisible: ( post ) => post.isActive === true,
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
			isVisible: ( post ) => post.isActive === true,
		},
		{
			id: 'homepageDisplay',
			label: 'Homepage display',
			elements: [
				{ value: 'latest', label: 'Latest post' },
				{ value: 'static', label: 'Static page' },
			],
		},
		{
			id: 'staticHomepage',
			label: 'Static homepage',
			elements: [
				{ value: 'welcome', label: 'Welcome to my website' },
				{ value: 'about', label: 'About' },
			],
			isVisible: ( post ) => post.homepageDisplay === 'static',
		},
	];
	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'booleanExample',
				children: [ 'isActive', 'name', 'email' ],
			},
			{
				id: 'selectExample',
				children: [ 'homepageDisplay', 'staticHomepage' ],
			},
		],
	};
	return (
		<DataForm< Post >
			data={ data }
			fields={ _fields }
			form={ form }
			onChange={ ( edits ) =>
				setData( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

export default VisibilityComponent;
