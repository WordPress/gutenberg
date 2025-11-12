/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { TabbableContainer } from '..';

const meta: Meta< typeof TabbableContainer > = {
	title: 'Components/Containers/TabbableContainer',
	id: 'components-tabbablecontainer',
	component: TabbableContainer,
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

export const Default: StoryFn< typeof TabbableContainer > = ( args ) => {
	return (
		<>
			<button>Before tabbable container</button>
			<TabbableContainer
				{ ...args }
				style={ {
					margin: '32px 0',
					padding: '16px',
					border: '1px solid black',
				} }
			>
				<button>Item 1</button>
				<button>Item 2</button>
				<button disabled>Item 3 (disabled)</button>
				<button tabIndex={ -1 }>Item 4 (non-tabbable)</button>
				<button tabIndex={ 0 }>Item 5</button>
				<button>Item 6</button>
			</TabbableContainer>
			<button>After tabbable container</button>
		</>
	);
};
