/**
 * WordPress dependencies
 */
import { box, button, cog, paragraph } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../';

const meta = {
	title: 'BlockEditor/BlockIcon',
	component: BlockIcon,
	parameters: {
		docs: {
			description: {
				component:
					'The `BlockIcon` component allows to display an icon for a block.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
	argTypes: {
		icon: {
			control: 'select',
			options: [ 'paragraph', 'cog', 'box', 'button' ],
			mapping: {
				paragraph,
				cog,
				box,
				button,
			},
			description:
				'The icon of the block. This can be any of [WordPress Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.',
			table: {
				type: { summary: 'string | object' },
			},
		},
		showColors: {
			control: 'boolean',
			description: 'Whether to show background and foreground colors.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class for the icon.',
			table: {
				type: { summary: 'string' },
			},
		},
		context: {
			control: 'text',
			description: 'Context where the icon is being used.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		icon: 'paragraph',
	},
};
