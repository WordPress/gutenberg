/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockTools from '../';

export default {
	title: 'BlockEditor/BlockTools',
	component: BlockTools,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Block tools (the block toolbar, select/navigation mode toolbar, the insertion point and a slot for the inline rich text toolbar). Must be wrapped around the block content and editor styles wrapper or iframe.',
			},
		},
	},
	argTypes: {
		children: {
			control: {
				type: null,
			},
			description: 'The block content and style container.',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		__unstableContentRef: {
			control: {
				type: 'object',
			},
			description: 'Ref holding the content scroll container.',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		props: {
			control: {
				type: 'object',
			},
			description: 'Props',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
	},
};

export const Default = {
	args: {
		children: <h2>{ __( 'Block content' ) }</h2>,
	},
	render: function Template( { children, ...args } ) {
		return <BlockTools { ...args }>{ children }</BlockTools>;
	},
};
