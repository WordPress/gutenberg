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
		},
		children: {
			control: { type: 'text' },
		},
		icon: {
			control: { type: 'select' },
			options: [ 'wordpress', 'link', 'more' ],
			mapping: {
				wordpress,
				link,
				more,
			},
		},
		iconSize: {
			control: { type: 'number' },
		},
		isBusy: {
			control: 'boolean',
		},
		isDestructive: {
			control: 'boolean',
		},
		isSmall: {
			control: 'boolean',
		},
		disabled: {
			control: 'boolean',
		},
		variant: {
			options: [ 'primary', 'secondary', 'tertiary', 'link' ],
			control: { type: 'select' },
		},
		__experimentalIsFocusable: {
			control: 'boolean',
		},
	},
};

function Template( { children, ...props } ) {
	return <Button { ...props }>{ children }</Button>;
}

export const Default = Template.bind( {} );
Default.args = {
	children: 'Code is poetry',
	variant: undefined,
};

export const Icon = Template.bind( {} );
Icon.args = {
	label: 'Code is poetry',
	icon: 'wordpress',
	iconSize: 24,
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

export const buttons = () => {
	return (
		<div style={ { padding: '20px' } }>
			<h2>Small Buttons</h2>
			<div className="story-buttons-container">
				<Button isSmall>Button</Button>
				<Button variant="primary" isSmall>
					Primary Button
				</Button>
				<Button variant="secondary" isSmall>
					Secondary Button
				</Button>
				<Button variant="tertiary" isSmall>
					Tertiary Button
				</Button>
				<Button isSmall icon={ more } />
				<Button isSmall variant="primary" icon={ more } />
				<Button isSmall variant="secondary" icon={ more } />
				<Button isSmall variant="tertiary" icon={ more } />
				<Button isSmall variant="primary" icon={ more }>
					Icon & Text
				</Button>
			</div>

			<h2>Regular Buttons</h2>
			<div className="story-buttons-container">
				<Button>Button</Button>
				<Button variant="primary">Primary Button</Button>
				<Button variant="secondary">Secondary Button</Button>
				<Button variant="tertiary">Tertiary Button</Button>
				<Button icon={ more } />
				<Button variant="primary" icon={ more } />
				<Button variant="secondary" icon={ more } />
				<Button variant="tertiary" icon={ more } />
				<Button variant="primary" icon={ more }>
					Icon & Text
				</Button>
			</div>
		</div>
	);
};
