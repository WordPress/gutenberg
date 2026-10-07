/**
 * Internal dependencies
 */
import DefaultBlockAppender from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';

const meta = {
	title: 'BlockEditor/DefaultBlockAppender',
	component: DefaultBlockAppender,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'DefaultBlockAppender provides a user interface for adding blocks to empty containers. Shows placeholder text and an inserter button.',
			},
		},
	},
	decorators: [
		( Story ) => (
			<ExperimentalBlockEditorProvider
				value={ [] }
				settings={ {
					bodyPlaceholder:
						'Start writing or type / to choose a block',
				} }
			>
				<Story />
			</ExperimentalBlockEditorProvider>
		),
	],
	argTypes: {
		rootClientId: {
			control: false,
			description:
				'The root client ID where new blocks will be inserted.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: '""' },
			},
		},
	},
	args: {
		rootClientId: '',
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return <DefaultBlockAppender { ...args } />;
	},
};
