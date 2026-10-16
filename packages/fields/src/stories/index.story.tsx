import { useState } from '@wordpress/element';
import type { Field, View, Form } from '@wordpress/dataviews';
import { DataForm, DataViews } from '@wordpress/dataviews';
import { orderField } from '../fields';
import type { BasePost } from '../types';

export default {
	id: 'fields-base-fields',
	title: 'Design System/DataViews/Fields/Base Fields',
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

// Create a showcase of all base fields.
const showcaseFields: Field< any >[] = [ orderField ];

const DataFormsComponent = ( { type }: { type: 'regular' | 'panel' } ) => {
	const [ data, setData ] = useState( sampleBasePost );

	const handleChange = ( updates: Partial< BasePost > ) => {
		setData( ( prev ) => ( { ...prev, ...updates } ) );
	};

	// Form configuration for the showcase.
	const showcaseForm: Form = {
		layout: {
			type,
		},
		fields: [ 'menu_order' ],
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
		titleField: undefined,
		descriptionField: undefined,
		mediaField: undefined,
	} );
	const [ data ] = useState( [ sampleBasePost ] );

	const paginationInfo = {
		totalItems: 1,
		totalPages: 1,
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
			/>
		</div>
	);
};
