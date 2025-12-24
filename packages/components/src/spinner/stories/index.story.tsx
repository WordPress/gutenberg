/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react';

/**
 * Internal dependencies
 */
import Spinner from '../';
import { space } from '../../utils/space';

const meta: Meta< typeof Spinner > = {
	title: 'Components/Feedback/Spinner',
	id: 'components-spinner',
	component: Spinner,
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Spinner > = ( args ) => {
	return <Spinner { ...args } />;
};

export const Default: StoryFn< typeof Spinner > = Template.bind( {} );

// The Spinner can be resized to any size, but the stroke width will remain unchanged.
export const CustomSize: StoryFn< typeof Spinner > = Template.bind( {} );
CustomSize.args = { style: { width: space( 20 ), height: space( 20 ) } };
