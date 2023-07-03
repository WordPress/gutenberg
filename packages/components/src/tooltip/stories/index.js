/**
 * Internal dependencies
 */
import Tooltip from '../';

export default {
	title: 'Components/ToolTip',
	component: Tooltip,
	argTypes: {
		delay: { control: 'number' },
		position: {
			control: {
				type: 'select',
				options: [
					'top left',
					'top center',
					'top right',
					'bottom left',
					'bottom center',
					'bottom right',
				],
			},
		},
		text: { control: 'text' },
	},
	parameters: {
		docs: { source: { state: 'open' } },
	},
};

const Template = ( args ) => {
	return <Tooltip { ...args } />;
};

export const Default = Template.bind( {} );
Default.args = {
	text: 'More information',
	children: (
		<div
			style={ {
				margin: '50px auto',
				width: '200px',
				padding: '20px',
				textAlign: 'center',
				border: '1px solid #ccc',
			} }
		>
			Hover for more information
		</div>
	),
};

export const SmallTarget = Template.bind( {} );
SmallTarget.args = {
	...Default.args,
	children: (
		<div
			style={ {
				margin: '50px auto',
				width: 'min-content',
				padding: '4px',
				textAlign: 'center',
				border: '1px solid #ccc',
			} }
		>
			Small target
		</div>
	),
};

export const DisabledChild = Template.bind( {} );
DisabledChild.args = {
	...Default.args,
	children: (
		<button
			disabled
			onClick={ () =>
				// eslint-disable-next-line no-alert
				window.alert( 'This alert should not be triggered' )
			}
		>
			Hover me, but I am disabled
		</button>
	),
};
