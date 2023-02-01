/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '..';

const meta: ComponentMeta< typeof KeyboardShortcuts > = {
	component: KeyboardShortcuts,
	title: 'Components/KeyboardShortcuts',
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof KeyboardShortcuts > = ( props ) => (
	<KeyboardShortcuts { ...props } />
);

export const Default = Template.bind( {} );
Default.args = {
	shortcuts: {
		// eslint-disable-next-line no-alert
		a: () => window.alert( 'You hit "a"!' ),
		// eslint-disable-next-line no-alert
		b: () => window.alert( 'You hit "b"!' ),
	},
	children: (
		<div>
			<p>{ `Hit the "a" or "b" key in this textarea:` }</p>
			<textarea />
		</div>
	),
};
Default.parameters = {
	docs: {
		source: {
			code: `
<KeyboardShortcuts
  shortcuts={{
    a: () => window.alert('You hit "a"!'),
    b: () => window.alert('You hit "b"!'),
  }}
>
  <div>
    <p>
      Hit the "a" or "b" key in this textarea:
    </p>
    <textarea />
  </div>
</KeyboardShortcuts>
			`,
		},
	},
};
