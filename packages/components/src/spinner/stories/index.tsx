/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import Spinner from '../';
import { space } from '../../ui/utils/space';

const meta: ComponentMeta< typeof Spinner > = {
	title: 'Components/Spinner',
	component: Spinner,
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Spinner > = ( args ) => {
	return <Spinner { ...args } />;
};

export const Default: ComponentStory< typeof Spinner > = Template.bind( {} );

// The Spinner can be resized to any size, but the stroke width will remain unchanged.
export const CustomSize: ComponentStory< typeof Spinner > = Template.bind( {} );
CustomSize.args = { style: { width: space( 20 ), height: space( 20 ) } };
