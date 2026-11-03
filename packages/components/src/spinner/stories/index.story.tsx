import type { StoryFn, Meta } from '@storybook/react-vite';
import Spinner from '../';

const meta: Meta< typeof Spinner > = {
	title: 'Components/@wordpress-components/Feedback/Spinner',
	id: 'components-spinner',
	component: Spinner,
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use [`Spinner`](?path=/docs/design-system-components-spinner--docs) from `@wordpress/ui` instead.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof Spinner > = ( args ) => {
	return <Spinner { ...args } />;
};

export const Default: StoryFn< typeof Spinner > = Template.bind( {} );

export const CustomSize: StoryFn< typeof Spinner > = Template.bind( {} );
CustomSize.args = {
	style: {
		width: 'var(--wpds-dimension-size-lg)',
		height: 'var(--wpds-dimension-size-lg)',
	},
};
