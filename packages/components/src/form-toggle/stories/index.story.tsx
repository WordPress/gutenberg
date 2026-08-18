import type { Meta, StoryFn } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
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
	},
};
export default meta;

const Template: StoryFn< typeof FormToggle > = ( { onChange, ...args } ) => {
	const [ isChecked, setChecked ] = useState( true );
	const id = useId();

	return (
		<div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
			{ /* FormToggle has no built-in label; paired here so the example is copy-paste safe. */ }
			<label htmlFor={ id }>Enable feature</label>
			<FormToggle
				{ ...args }
				id={ id }
				checked={ isChecked }
				onChange={ ( e ) => {
					setChecked( ( state ) => ! state );
					onChange( e );
				} }
			/>
		</div>
	);
};

export const Default: StoryFn< typeof FormToggle > = Template.bind( {} );
Default.args = {};
