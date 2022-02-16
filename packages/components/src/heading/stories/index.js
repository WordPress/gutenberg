/**
 * Internal dependencies
 */
import { Heading } from '../';

export default {
	component: Heading,
	title: 'Components (Experimental)/Heading',
	argTypes: {
		color: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
	},
};

export const Default = ( props ) => <Heading { ...props } />;
Default.args = {
	children: 'Heading',
};
