/**
 * Internal dependencies
 */
import { Heading } from '../';
import { Heading as UnconnectedHeading } from '../component';

export default {
	component: UnconnectedHeading,
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
