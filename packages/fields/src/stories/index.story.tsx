/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { DataForm, DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */

import {
	slugField,
	titleField,
	orderField,
	passwordField,
	statusField,
	commentStatusField,
	dateField,
	authorField,
} from '../fields';

// Fields not yet covered:
// pageTitleField,
// templateTitleField,
// patternTitleField,
// featuredImageField,
// templateField,
// parentField,

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

// Create a comprehensive field showcase
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

// Form configuration for showcase
const showcaseForm = {
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

export const DataFormsPreview = () => {
	const [ data, setData ] = useState( samplePostWithAuthor );

	const handleChange = ( updates: Partial< BasePostWithEmbeddedAuthor > ) => {
		setData( ( prev ) => ( { ...prev, ...updates } ) );
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
