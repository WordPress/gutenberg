/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import Breadcrumb from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';

// For the purpose of this story, we need to register the core blocks samples.
registerCoreBlocks();
const blocks = [
	createBlock( 'core/group', {}, [
		createBlock( 'core/group', {}, [ createBlock( 'core/paragraph' ) ] ),
	] ),
];

const clientId = blocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 0 ].clientId;

const selection = {
	selectionEnd: {
		clientId,
	},
	selectionStart: {
		clientId,
	},
};

/**
 * The block breadcrumb trail displays the hierarchy of the current block selection as a breadcrumb. It also allows, using this hierarchy, to navigate to the parent elements of the current block selection. It is located at the very bottom of the editor interface.
 */
const meta = {
	title: 'BlockEditor/Breadcrumb',
	component: Breadcrumb,
	argTypes: {
		rootLabelText: {
			control: 'text',
			defaultValue: '',
			description:
				'Label text for the root element (the first `<li />`) of the breadcrumb trail.',
		},
	},
	decorators: [
		( Story ) => (
			<ExperimentalBlockEditorProvider
				value={ blocks }
				selection={ selection }
			>
				<Story />
			</ExperimentalBlockEditorProvider>
		),
	],
};
export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		return <Breadcrumb { ...args } />;
	},
};
