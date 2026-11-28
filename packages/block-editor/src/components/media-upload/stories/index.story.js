/**
 * Internal dependencies
 */
import MediaUpload from '..';
import MediaUploadCheck from '../check';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'editor.MediaUpload',
	'core/edit-post/components/media-upload/replace-media-upload',
	replaceMediaUpload
);

const meta = {
	title: 'BlockEditor/MediaUpload',
	component: MediaUpload,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `MediaUpload` component provides a way to upload media files.',
			},
		},
	},
	argTypes: {
		allowedTypes: {
			control: {
				type: 'object',
			},
			description:
				"Array of allowed media types. Default value is `['image', 'video', 'audio']`.",
			table: {
				type: { summary: 'Array' },
			},
		},
		mode: {
			control: {
				type: 'select',
				options: [ 'browse', 'upload' ],
			},
			description:
				'Value of Frame content default mode like `browse`, `upload` etc.',
			table: {
				type: { summary: 'string' },
			},
		},
		multiple: {
			control: {
				type: 'boolean | string',
			},
			description: 'Whether to allow multiple files to be selected.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		value: {
			control: {
				type: 'number | string',
			},
			description:
				'Media ID (or media IDs if multiple is true) to be selected by default when opening the media library.',
			table: {
				type: { summary: 'string' },
			},
		},
		onClose: {
			action: 'onClose',
			control: {
				type: 'function',
			},
			description: 'Callback function when the media library is closed.',
			table: {
				type: { summary: 'function' },
			},
		},
		onSelect: {
			action: 'onSelect',
			control: {
				type: 'function',
			},
			description: 'Callback function when media is selected.',
			table: {
				type: { summary: 'function' },
			},
		},
		title: {
			control: {
				type: 'string',
			},
			description: 'Title of the media library.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: 'Select or Upload Media' },
			},
		},
		modalClass: {
			control: {
				type: 'string',
			},
			description: 'Class name to be added to the modal.',
			table: {
				type: { summary: 'string' },
			},
		},
		addToGallery: {
			control: {
				type: 'boolean',
			},
			description: 'Whether to show the "Add to Gallery" tab.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		autoOpen: {
			control: {
				type: 'boolean',
			},
			description: 'Whether to automatically open the media library.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		gallery: {
			control: {
				type: 'boolean',
			},
			description: 'Whether to show the gallery tab.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		render: {
			control: {
				type: 'function',
			},
			description: 'Render prop to render the component.',
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		onSelect: () => {},
	},
	render: function Template( args ) {
		return (
			<MediaUploadCheck>
				<MediaUpload
					{ ...args }
					render={ ( { open } ) => (
						<Button onClick={ open }>
							{ __( 'Open Media Library' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
		);
	},
};
