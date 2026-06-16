/**
 * Internal dependencies
 */
import ImageEditor from '..';

const meta = {
	title: 'BlockEditor/ImageEditor',
	component: ImageEditor,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `ImageEditor` component is used to edit images in the block editor',
			},
		},
	},
	argTypes: {
		id: {
			control: {
				type: 'text',
			},
			description: 'The id of the image being edited',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		url: {
			control: {
				type: 'text',
			},
			description: 'The url of the image being edited',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		width: {
			control: {
				type: 'number',
			},
			description: 'The width of the image being edited',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		height: {
			control: {
				type: 'number',
			},
			description: 'The height of the image being edited',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		naturalHeight: {
			control: {
				type: 'number',
			},
			description: 'The natural height of the image being edited',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		naturalWidth: {
			control: {
				type: 'number',
			},
			description: 'The natural width of the image being edited',
			table: {
				type: {
					summary: 'number',
				},
			},
		},
		onSaveImage: {
			control: {
				type: null,
			},
			description: 'Function to call when the image is saved',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		onFinishEditing: {
			control: {
				type: null,
			},
			description: 'Function to call when editing is finished',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		borderProps: {
			control: {
				type: 'object',
			},
			description: 'The area around the image',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		id: 'image-id',
		url: 'https://cdn-icons-png.flaticon.com/512/174/174881.png',
		width: 300,
		height: 300,
		naturalHeight: 600,
		naturalWidth: 800,
		borderProps: {
			style: {
				backgroundColor: '#e0e0e0',
				border: '1px solid #000',
			},
		},
	},
	render: function Template( args ) {
		return <ImageEditor { ...args } />;
	},
};
