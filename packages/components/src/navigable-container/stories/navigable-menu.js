/**
 * Internal dependencies
 */
import { NavigableMenu } from '..';

export default {
	title: 'Components/NavigableMenu',
	component: NavigableMenu,
	argTypes: {
		children: { type: null },
		cycle: {
			type: 'boolean',
		},
		onNavigate: { action: 'onNavigate' },
		orientation: {
			options: [ 'horizontal', 'vertical' ],
			control: { type: 'radio' },
		},
	},
};

export const Default = ( args ) => {
	return (
		<>
			<button>Before navigable menu</button>
			<NavigableMenu
				{ ...args }
				style={ {
					margin: '32px 0',
					padding: '16px',
					border: '1px solid black',
				} }
			>
				<button role="menuitem">Item 1</button>
				<button role="menuitem">Item 2</button>
				<button role="menuitem" disabled>
					Item 3 (disabled)
				</button>
				<button role="menuitem" tabIndex={ -1 }>
					Item 4 (non-tabbable)
				</button>
				<button role="menuitem" tabIndex={ 0 }>
					Item 5
				</button>
				<button role="menuitem">Item 6</button>
			</NavigableMenu>
			<button>After navigable menu</button>
		</>
	);
};
