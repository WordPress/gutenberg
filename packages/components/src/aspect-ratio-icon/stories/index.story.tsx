import type { Meta, StoryObj } from '@storybook/react-vite';
import AspectRatioIcon from '..';

const meta: Meta< typeof AspectRatioIcon > = {
	id: 'components-aspectratioicon',
	title: 'Components/@wordpress-components/Icons/AspectRatioIcon',
	component: AspectRatioIcon,
	tags: [ 'status-private' ],
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
		},
	},
};
export default meta;

type Story = StoryObj< typeof AspectRatioIcon >;

export const Default: Story = {
	args: {
		ratio: 1.5,
	},
};

/**
 * Ratios are clamped between 1:3 and 3:1, so that a very wide or very tall
 * ratio is still visible. Values that are not a ratio get the generic icon.
 */
export const Ratios: Story = {
	render: () => (
		<div style={ { display: 'flex', gap: 8 } }>
			{ [
				undefined,
				1,
				4 / 3,
				3 / 4,
				16 / 9,
				9 / 16,
				21 / 9,
				1 / 10,
			].map( ( ratio, index ) => (
				<AspectRatioIcon key={ index } ratio={ ratio } />
			) ) }
		</div>
	),
};
