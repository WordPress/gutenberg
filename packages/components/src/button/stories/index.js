/**
 * WordPress dependencies
 */
import {
	formatBold,
	formatItalic,
	link,
	more,
	wordpress,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.css';
import Button from '../';

export default {
	title: 'Components/Button',
	component: Button,
	argTypes: {
		label: {
			control: { type: 'text' },
			description:
				'Sets the `aria-label` of the component, if none is provided. Sets the Tooltip content if `showTooltip` is provided.',
			table: {
				defaultValue: { summary: '' },
			},
		},
		children: {
			control: { type: 'text' },
			table: {
				defaultValue: { summary: undefined },
			},
		},
		icon: {
			control: { type: 'select' },
			description:
				'If provided, renders an `Icon` component inside the button.',
			options: [ 'wordpress', 'link', 'more' ],
			mapping: {
				wordpress,
				link,
				more,
			},
			table: {
				defaultValue: { summary: `null` },
			},
		},
		iconSize: {
			control: { type: 'number' },
			description: 'If provided with `icon`, sets the icon size.',
			table: {
				defaultValue: { summary: 24 },
			},
		},
		iconPosition: {
			control: { type: 'select' },
			description:
				'If provided with `icon`, sets the position of icon relative to the `text`. Available options are `left|right`.',
			options: [ 'left', 'right' ],
			table: {
				defaultValue: { summary: `left` },
			},
		},
		isBusy: {
			control: 'boolean',
			description:
				'Indicates activity while a action is being performed.',
			table: {
				defaultValue: { summary: false },
			},
		},
		isDestructive: {
			control: 'boolean',
			description:
				'Renders a red text-based button style to indicate destructive behavior.',
			table: {
				defaultValue: { summary: false },
			},
		},
		isPressed: {
			control: 'boolean',
			description: 'Renders a pressed button style.',
			table: {
				defaultValue: { summary: false },
			},
		},
		isSmall: {
			control: 'boolean',
			description: 'Decreases the size of the button.',
			table: {
				defaultValue: { summary: false },
			},
		},
		disabled: {
			control: 'boolean',
			description:
				'Whether the button is disabled. If `true`, this will force a `button` element to be rendered.',
			table: {
				defaultValue: { summary: false },
			},
		},
		shortcut: {
			control: { type: 'text' },
			description:
				'If provided with `showTooltip`, appends the Shortcut label to the tooltip content. If an `Object` is provided, it should contain `display` and `ariaLabel` keys.',
			table: {
				defaultValue: { summary: 'undefined' },
			},
		},
		showTooltip: {
			control: 'boolean',
			description:
				'If provided, renders a `Tooltip` component for the button.',
			table: {
				defaultValue: { summary: false },
			},
		},
		tooltipPosition: {
			control: { type: 'text' },
			description:
				'If provided with `showTooltip`, sets the position of the tooltip.',
			table: {
				defaultValue: { summary: 'top center' },
			},
		},
		text: {
			control: { type: 'text' },
			description:
				'If provided, displays the given text inside the button. If the button contains `children` elements, the text is displayed before them.',
			table: {
				defaultValue: { summary: '' },
			},
		},
		variant: {
			control: { type: 'select' },
			description: "Specifies the button's style.",
			options: [ 'primary', 'secondary', 'tertiary', 'link' ],
			table: {
				defaultValue: { summary: `undefined` },
			},
		},
		__experimentalIsFocusable: {
			control: 'boolean',
			description: 'Makes the button focusable even when disabled',
			table: {
				defaultValue: { summary: false },
			},
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

function Template( { children, ...props } ) {
	return <Button { ...props }>{ children }</Button>;
}

export const Default = Template.bind( {} );
Default.args = {
	children: 'Code is poetry',
};

export const Icon = Template.bind( {} );
Icon.args = {
	label: 'Code is poetry',
	icon: 'wordpress',
};

export const groupedIcons = () => {
	const GroupContainer = ( { children } ) => (
		<div style={ { display: 'inline-flex' } }>{ children }</div>
	);

	return (
		<GroupContainer>
			<Button icon={ formatBold } label="Bold" />
			<Button icon={ formatItalic } label="Italic" />
			<Button icon={ link } label="Link" />
		</GroupContainer>
	);
};
