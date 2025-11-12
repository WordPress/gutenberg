/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '..';

const meta: Meta< typeof NavigableMenu > = {
	title: 'Components/Containers/NavigableMenu',
	id: 'components-navigablemenu',
	component: NavigableMenu,
	argTypes: {
		children: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof NavigableMenu > = ( args ) => {
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
				<div role="menuitem">Item 1 (non-tabbable, non-focusable)</div>
				<button role="menuitem">Item 2 (tabbable, focusable)</button>
				<button role="menuitem" disabled>
					Item 3 (disabled, therefore non-tabbable and not-focusable)
				</button>
				<span role="menuitem" tabIndex={ -1 }>
					Item 4 (non-tabbable, non-focusable)
				</span>
				<div role="menuitem" tabIndex={ 0 }>
					Item 5 (tabbable, focusable)
				</div>
			</NavigableMenu>
			<button>After navigable menu</button>
		</>
	);
};
