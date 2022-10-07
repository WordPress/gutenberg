/**
 * Internal dependencies
 */
import { DuotoneSwatch } from '../';

export default {
	title: 'Components/DuotoneSwatch',
	component: DuotoneSwatch,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const Template = ( args ) => {
	return <DuotoneSwatch { ...args } />;
};

export const Default = Template.bind( {} );
Default.args = {
	values: [ '#000', '#fff' ],
};

export const SingleColor = Template.bind( {} );
SingleColor.args = {
	values: [ 'pink' ],
};

export const Null = Template.bind( {} );
Null.args = {
	values: null,
};
