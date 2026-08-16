/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../';
import { useState } from '@wordpress/element';

export default {
	title: 'BlockEditor/MediaReplaceFlow',
	component: MediaReplaceFlow,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A component that implements a replacement flow for various media objects.',
			},
		},
	},
	argTypes: {
		mediaURL: {
			control: 'text',
			description: 'The URL of the media.',
			table: {
				type: { summary: 'string' },
			},
		},
		mediaId: {
			control: 'number',
			description:
				'The Id of the attachment post type for the current media.',
			table: {
				type: { summary: 'int' },
			},
		},
		allowedTypes: {
			control: 'array',
			description:
				'A list of media types allowed to replace the current media.',
			table: {
				type: { summary: 'array' },
			},
		},
		accept: {
			control: 'text',
			description: 'The mime type of the media.',
			table: {
				type: { summary: 'string' },
			},
		},
		onSelect: {
			control: { type: 'function' },
			description: __( 'Callback when media is selected.' ),
			table: {
				type: { summary: 'function' },
			},
		},
		onSelectURL: {
			control: { type: 'function' },
			description: __( 'Callback when media URL is selected.' ),
			table: {
				type: { summary: 'function' },
			},
		},
		onError: {
			control: { type: 'function' },
			description: __( 'Callback when an error happens.' ),
			table: {
				type: { summary: 'function' },
			},
		},
		name: {
			control: 'text',
			description: 'The label of the replace button.',
			table: {
				type: { summary: 'string' },
			},
		},
		createNotice: {
			control: { type: 'function' },
			description: __( 'Callback to create a notice.' ),
			table: {
				type: { summary: 'function' },
			},
		},
		removeNotice: {
			control: { type: 'function' },
			description: __( 'Callback to remove a notice.' ),
			table: {
				type: { summary: 'function' },
			},
		},
	},
};

export const Default = {
	args: {
		allowedTypes: [ 'png' ],
		accept: 'image/*',
	},
	render: function Template( args ) {
		const [ mediaURL, setMediaURL ] = useState( 'https://example.media' );
		return (
			<MediaReplaceFlow
				{ ...args }
				mediaURL={ mediaURL }
				onSelectURL={ setMediaURL }
			/>
		);
	},
};
