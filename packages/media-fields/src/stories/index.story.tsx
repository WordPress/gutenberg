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
	altTextField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mediaThumbnailField,
	mimeTypeField,
	type MediaItem,
} from '../index';

export default {
	title: 'Fields/Media Fields',
	component: DataForm,
};

// Sample data for media fields
const sampleMediaItem: MediaItem = {
	id: 123,
	date: '2024-01-15T10:30:00',
	date_gmt: '2024-01-15T10:30:00',
	guid: {
		raw: 'https://cldup.com/cXyG__fTLN.jpg',
		rendered: 'https://cldup.com/cXyG__fTLN.jpg',
	},
	modified: '2024-01-15T10:30:00',
	modified_gmt: '2024-01-15T10:30:00',
	slug: 'sample-image',
	status: 'publish',
	type: 'attachment',
	link: 'https://example.com/sample-image/',
	title: {
		raw: 'Sample Image',
		rendered: 'Sample Image',
	},
	author: 1,
	featured_media: 0,
	comment_status: 'open',
	ping_status: 'closed',
	template: '',
	meta: {},
	permalink_template: 'https://example.com/?attachment_id=123',
	generated_slug: 'sample-image',
	class_list: [ 'post-123', 'attachment' ],
	alt_text: 'A beautiful sample image',
	caption: {
		raw: 'A caption for the image',
		rendered: '<p>A caption for the image</p>\n',
	},
	description: {
		raw: 'This is a detailed description of the sample image. It contains useful information about what the image depicts and its context.',
		rendered:
			'<p>This is a detailed description of the sample image. It contains useful information about what the image depicts and its context.</p>',
	},
	mime_type: 'image/jpeg',
	media_type: 'image',
	post: null,
	source_url: 'https://cldup.com/cXyG__fTLN.jpg',
	media_details: {
		file: 'sample-image.jpg',
		width: 1920,
		height: 1080,
		filesize: 524288,
		image_meta: {
			aperture: '2.8',
			credit: '',
			camera: 'Sample Camera',
			caption: '',
			created_timestamp: '1705315800',
			copyright: '',
			focal_length: '50',
			iso: '100',
			shutter_speed: '0.004',
			title: '',
			orientation: '1',
			keywords: [],
		},
		sizes: {
			thumbnail: {
				file: 'sample-image-150x150.jpg',
				width: 150,
				height: 150,
				filesize: 8192,
				mime_type: 'image/jpeg',
				source_url: 'https://cldup.com/cXyG__fTLN.jpg',
			},
			medium: {
				file: 'sample-image-300x169.jpg',
				width: 300,
				height: 169,
				filesize: 24576,
				mime_type: 'image/jpeg',
				source_url: 'https://cldup.com/cXyG__fTLN.jpg',
			},
		},
	},
	missing_image_sizes: [],
};

// Sample data for a non-image file (ZIP)
const sampleMediaItemZip: MediaItem = {
	id: 101,
	date: '2025-11-07T00:28:54',
	date_gmt: '2025-11-07T00:28:54',
	guid: {
		raw: 'http://localhost:8888/wp-content/uploads/2025/11/gutenberg-v22-0-0.zip',
		rendered:
			'http://localhost:8888/wp-content/uploads/2025/11/gutenberg-v22-0-0.zip',
	},
	modified: '2025-11-07T00:28:54',
	modified_gmt: '2025-11-07T00:28:54',
	slug: 'gutenberg-v22-0-0',
	status: 'publish',
	type: 'attachment',
	link: 'http://localhost:8888/gutenberg-v22-0-0/',
	title: {
		raw: 'gutenberg-v22-0-0',
		rendered: 'gutenberg-v22-0-0',
	},
	author: 1,
	featured_media: 0,
	comment_status: 'open',
	ping_status: 'closed',
	template: '',
	meta: {},
	permalink_template: 'http://localhost:8888/?attachment_id=101',
	generated_slug: 'gutenberg-v22-0-0',
	class_list: [ 'post-101', 'attachment' ],
	alt_text: '',
	caption: {
		raw: '',
		rendered: '<p>gutenberg-v22-0-0</p>\n',
	},
	description: {
		raw: '',
		rendered: '',
	},
	mime_type: 'application/zip',
	media_type: 'file',
	post: 1,
	source_url:
		'http://localhost:8888/wp-content/uploads/2025/11/gutenberg-v22-0-0.zip',
	media_details: {
		file: 'gutenberg-v22-0-0.zip',
		filesize: 19988723,
		width: 0,
		height: 0,
		image_meta: {
			aperture: '',
			credit: '',
			camera: '',
			caption: '',
			created_timestamp: '',
			copyright: '',
			focal_length: '',
			iso: '',
			shutter_speed: '',
			title: '',
			orientation: '',
			keywords: [],
		},
		sizes: {},
	},
	missing_image_sizes: [],
};

// Create a showcase of all media fields.
const showcaseFields = [
	mediaThumbnailField,
	filenameField,
	altTextField,
	captionField,
	descriptionField,
	mimeTypeField,
	mediaDimensionsField,
	filesizeField,
] as Field< any >[];

const DataFormsComponent = ( { type }: { type: 'regular' | 'panel' } ) => {
	const [ data, setData ] = useState< MediaItem >( sampleMediaItem );

	const handleChange = ( updates: Partial< MediaItem > ) => {
		setData( ( prev: MediaItem ) => ( { ...prev, ...updates } ) );
	};

	// Form configuration for the media fields showcase.
	const showcaseForm: Form = {
		layout: {
			type,
		},
		fields: [
			'media_thumbnail',
			'alt_text',
			'caption',
			'description',
			'filename',
			'mime_type',
			'media_dimensions',
			'filesize',
		],
	};

	return (
		<div style={ { padding: '20px' } }>
			<h2>Media Fields</h2>
			<p>
				This story demonstrates all the media fields from the
				@wordpress/media-fields package within a DataForm.
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
		fields: showcaseFields
			.map( ( f ) => f.id )
			.filter( ( id ) => id !== 'media_thumbnail' ),
		descriptionField: undefined,
		mediaField: 'media_thumbnail',
		showTitle: false,
	} );
	const [ data ] = useState< MediaItem[] >( [
		sampleMediaItem,
		sampleMediaItemZip,
	] );

	const paginationInfo = {
		totalItems: 2,
		totalPages: 1,
	};

	const defaultLayouts = {
		table: {},
		list: {},
		grid: {},
	};

	return (
		<div style={ { padding: '20px' } }>
			<h2>Media Fields DataViews Preview</h2>
			<p>
				This story demonstrates all the media fields from the
				@wordpress/media-fields package, rendered in a DataViews
				component, allowing preview of view state and layout switching.
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
