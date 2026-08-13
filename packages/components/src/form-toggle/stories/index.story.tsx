import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import FormToggle from '..';

const meta: Meta< typeof FormToggle > = {
	tags: [ 'manifest' ],
	component: FormToggle,
	title: 'Components/FormToggle',
	argTypes: {
		onChange: {
			action: 'onChange',
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'For standard toggles with labels, use `ToggleControl` instead.',
		},
		// FIXME: Story shows FormToggle without a visible label (label). Update it to use ToggleControl, or pair the toggle with a visible label, so the example is copy-paste safe.
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
};
export default meta;

const Template: StoryFn< typeof FormToggle > = ( { onChange, ...args } ) => {
	const [ isChecked, setChecked ] = useState( true );

	return (
		<FormToggle
			{ ...args }
			checked={ isChecked }
			onChange={ ( e ) => {
				setChecked( ( state ) => ! state );
				onChange( e );
			} }
		/>
	);
};

export const Default: StoryFn< typeof FormToggle > = Template.bind( {} );
Default.args = {};
