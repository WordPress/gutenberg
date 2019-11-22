/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import TabPanel from '../';

export default { title: 'Components|TabPanel', component: TabPanel };

export const _default = () => {
	return (
		<TabPanel className="my-tab-panel"
			activeClass="active-tab"
			tabs={ [
				{
					name: 'tab1',
					title: text( 'Tab 1 title', 'Tab 1' ),
					className: 'tab-one',
				},
				{
					name: 'tab2',
					title: text( 'Tab 2 title', 'Tab 2' ),
					className: 'tab-two',
				},
			] }>
			{
				( tab ) => <p>Selected tab: { tab.title }</p>
			}
		</TabPanel>
	);
};
