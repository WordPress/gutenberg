/**
 * Internal dependencies
 */
import Dropdown from '../';
import Button from '../../button';

export default {
	title: 'Components/Dropdown',
	component: Dropdown,
	argTypes: {
		expandOnMobile: { control: { type: 'boolean' } },
		focusOnMount: {
			control: {
				type: 'radio',
				options: [ 'firstElement', 'container', false ],
			},
		},
		headerTitle: { control: { type: 'text' } },
	},
};

const Template = ( args ) => {
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button onClick={ onToggle } aria-expanded={ isOpen } isPrimary>
					Open dropdown
				</Button>
			) }
			renderContent={ () => <div>This is the dropdown content.</div> }
			{ ...args }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	position: 'bottom right',
};
