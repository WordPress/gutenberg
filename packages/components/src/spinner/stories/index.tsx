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

// The width of the Spinner's border is not affected by the overall component's dimensions.
export const CustomSize: ComponentStory< typeof Spinner > = Template.bind( {} );
CustomSize.args = { style: { width: space( 20 ), height: space( 20 ) } };
