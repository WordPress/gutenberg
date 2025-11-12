/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { DataForm, DataViews, type Form } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */

import {
	authorField,
	commentStatusField,
	dateField,
	orderField,
	passwordField,
	slugField,
	statusField,
	titleField,
} from '../fields';

// Fields not yet covered:
// featuredImageField,
// pageTitleField,
// parentField,
// patternTitleField,
// templateField,
// templateTitleField,

import type { BasePost, BasePostWithEmbeddedAuthor } from '../types';

export default {
	title: 'Fields/Base Fields',
	component: DataForm,
};

// Sample data for different field types
const sampleBasePost: BasePost = {
	id: 1,
	title: { rendered: 'Sample Post Title', raw: 'Sample Post Title' },
	content: {
		rendered: '<p>This is sample content.</p>',
		raw: 'This is sample content.',
	},
	type: 'post',
	slug: 'sample-post-title',
	permalink_template: 'http://localhost:8888/%postname%/',
	date: '2024-01-15T10:30:00',
	modified: '2024-01-20T14:45:00',
	status: 'publish',
	comment_status: 'open',
	password: '',
	parent: 0,
	menu_order: 0,
	author: 1,
	featured_media: 123,
	template: 'single',
};

const samplePostWithAuthor: BasePostWithEmbeddedAuthor = {
	...sampleBasePost,
	_embedded: {
		author: [
			{
				name: 'John Doe',
				avatar_urls: {
					'24': 'https://gravatar.com/avatar?d=retro&s=24',
					'48': 'https://gravatar.com/avatar?d=retro&s=48',
					'96': 'https://gravatar.com/avatar?d=retro&s=96',
				},
			},
		],
	},
};

// Create a showcase of all base fields.
// This does not include fields that require more complex setups,
// however this could be extended in the future, by setting up the data
// stores to contain entities like pages, users, media, etc.
const showcaseFields: Field< any >[] = [
	titleField,
	slugField,
	statusField,
	dateField,
	authorField,
	commentStatusField,
	passwordField,
	orderField,
];

const DataFormsComponent = ( { type }: { type: 'regular' | 'panel' } ) => {
	const [ data, setData ] = useState( samplePostWithAuthor );

	const handleChange = ( updates: Partial< BasePostWithEmbeddedAuthor > ) => {
		setData( ( prev ) => ( { ...prev, ...updates } ) );
	};

	// Form configuration for the showcase.
	const showcaseForm: Form = {
		layout: {
			type,
		},
		fields: [
			'title',
			'slug',
			'status',
			'date',
			'author',
			'comment_status',
			'password',
			'menu_order',
		],
	};

	return (
		<div style={ { padding: '20px' } }>
			<h2>Base Fields</h2>
			<p>
				This story demonstrates all the base fields from the
				@wordpress/fields package within a DataForm.
			</p>

			<DataForm
				data={ data }
				fields={ showcaseFields }
				form={ showcaseForm }
				onChange={ handleChange }
			/>
		</div>
	);
};

export const DataFormsPreview = {
	render: DataFormsComponent,
	argTypes: {
		type: {
			control: { type: 'select' },
			description: 'Choose the layout type.',
			options: [ 'regular', 'panel' ],
		},
	},
	args: {
		type: 'regular',
	},
};

export const DataViewsPreview = () => {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		fields: showcaseFields.map( ( f ) => f.id ),
		titleField: 'title',
		descriptionField: undefined,
		mediaField: undefined,
	} );
	const [ data ] = useState( [ samplePostWithAuthor ] );

	const paginationInfo = {
		totalItems: 1,
		totalPages: 1,
	};

	const defaultLayouts = {
		table: {},
		list: {},
		grid: {},
	};

	return (
		<div style={ { padding: '20px' } }>
			<h2>Fields Package DataViews Preview</h2>
			<p>
				This story demonstrates all the base fields from the
				@wordpress/fields package, rendered in a DataViews component,
				allowing preview of view state and layout switching.
			</p>
			<DataViews
				data={ data }
				fields={ showcaseFields }
				view={ view }
				onChangeView={ ( nextView: View ) => setView( nextView ) }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
			/>
		</div>
	);
};
