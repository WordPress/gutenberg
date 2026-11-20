/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { MediaPlaceholder } from '@wordpress/block-editor';

const meta = {
	title: 'BlockEditor/MediaPlaceholder',
	component: MediaPlaceholder,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: __(
					'A placeholder for media in the block editor, allowing users to select or upload media files.'
				),
			},
		},
	},
	argTypes: {
		allowedTypes: {
			control: { type: 'array' },
			description: __( 'Array of allowed media types for replacing.' ),
			table: {
				type: { summary: 'array' },
				defaultValue: { summary: '["image"]' },
			},
		},
		multiple: {
			control: { type: 'boolean' },
			description: __(
				'Whether multiple media can be selected/uploaded.'
			),
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		onSelect: {
			control: { type: 'function' },
			description: __( 'Callback when media is selected/uploaded.' ),
			table: {
				type: { summary: 'function' },
			},
		},
		labels: {
			control: { type: 'object' },
			description: __(
				'Labels for the media placeholder, such as title and instructions.'
			),
			table: {
				type: { summary: 'object' },
				defaultValue: { summary: '{}' },
			},
		},
		disableDropZone: {
			control: { type: 'boolean' },
			description: __( 'Disables the drag-and-drop zone for media.' ),
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
	},
	args: {
		allowedTypes: [ 'image' ],
		multiple: false,
		onSelect: () => {},
		labels: { title: 'Select an image' },
		disableDropZone: false,
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return (
			<MediaPlaceholder { ...args }>
				<Button variant="primary">
					{ __( 'Upload or Select Media' ) }
				</Button>
			</MediaPlaceholder>
		);
	},
};

export const MultipleSelection = {
	render: function Template( args ) {
		return (
			<MediaPlaceholder { ...args } multiple>
				<Button variant="primary">
					{ __( 'Select Multiple Media' ) }
				</Button>
			</MediaPlaceholder>
		);
	},
};

export const WithCustomLabels = {
	render: function Template( args ) {
		return (
			<MediaPlaceholder
				{ ...args }
				labels={ { title: 'Upload your custom image' } }
			>
				<Button variant="primary">
					{ __( 'Upload Custom Image' ) }
				</Button>
			</MediaPlaceholder>
		);
	},
};

export const WithoutDropZone = {
	render: function Template( args ) {
		return (
			<MediaPlaceholder { ...args } disableDropZone>
				<Button variant="primary">{ __( 'Upload Media' ) }</Button>
			</MediaPlaceholder>
		);
	},
};
