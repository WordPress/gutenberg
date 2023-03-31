/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { TabbableContainer } from '..';

const meta: ComponentMeta< typeof TabbableContainer > = {
	title: 'Components/TabbableContainer',
	component: TabbableContainer,
	argTypes: {
		children: { type: undefined },
		cycle: {
			type: 'boolean',
		},
		onNavigate: { action: 'onNavigate' },
	},
};
export default meta;

export const Default: ComponentStory< typeof TabbableContainer > = ( args ) => {
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
