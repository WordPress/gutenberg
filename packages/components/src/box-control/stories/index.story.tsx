import type { Meta, StoryFn } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from '@wordpress/element';
import BoxControl from '../';
import styles from '../style.module.scss';

const meta: Meta< typeof BoxControl > = {
	title: 'Components/BoxControl',
	component: BoxControl,
	argTypes: {
		values: { control: false },
	},
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'editor',
			notes: 'This component is a fallback for themes that do not supply spacing presets. Most of the time `SpacingSizesControl` from `@wordpress/block-editor` is used instead.',
		},
	},
};
export default meta;

const TemplateUncontrolled: StoryFn< typeof BoxControl > = ( props ) => {
	return <BoxControl { ...props } />;
};

const TemplateControlled: StoryFn< typeof BoxControl > = ( props ) => {
	const [ values, setValues ] = useState< ( typeof props )[ 'values' ] >();

	return (
		<BoxControl
			values={ values }
			{ ...props }
			onChange={ ( nextValue ) => {
				setValues( nextValue );
				props.onChange?.( nextValue );
			} }
		/>
	);
};

export const Default = TemplateUncontrolled.bind( {} );
Default.args = {
	label: 'Label',
};
Default.play = async ( { canvasElement } ) => {
	const canvas = within( canvasElement );
	const allSidesInput = canvas.getByRole( 'textbox', {
		name: 'All sides',
	} );
	const inputWrapper = allSidesInput.closest(
		`.${ styles[ 'input-wrapper' ] }`
	);
	const resetButton = canvas.getByRole( 'button', { name: 'Reset' } );
	const linkedButtonWrapper = canvas
		.getByRole( 'button', { name: 'Unlink sides' } )
		.closest( `.${ styles[ 'linked-button-wrapper' ] }` );

	await expect( inputWrapper ).toBeInTheDocument();
	await expect( linkedButtonWrapper ).toBeInTheDocument();
	await expect( getComputedStyle( inputWrapper! ).gridColumnStart ).toBe(
		'1'
	);
	await expect( getComputedStyle( inputWrapper! ).gridColumnEnd ).toBe(
		'span 3'
	);
	await expect( getComputedStyle( resetButton ).gridRowStart ).toBe( '1' );
	await expect( getComputedStyle( resetButton ).gridColumnStart ).toBe(
		'2'
	);
	await expect( getComputedStyle( linkedButtonWrapper! ).gridRowStart ).toBe(
		'1'
	);
	await expect(
		getComputedStyle( linkedButtonWrapper! ).gridColumnStart
	).toBe( '3' );

	await userEvent.click(
		canvas.getByRole( 'button', { name: 'Unlink sides' } )
	);

	const topInputWrapper = canvas
		.getByRole( 'textbox', { name: 'Top side' } )
		.closest( `.${ styles[ 'input-wrapper' ] }` );

	await expect( topInputWrapper ).toBeInTheDocument();
	await expect( getComputedStyle( topInputWrapper! ).gridColumnStart ).toBe(
		'1'
	);
	await expect( getComputedStyle( topInputWrapper! ).gridColumnEnd ).toBe(
		'span 3'
	);
};

export const Controlled = TemplateControlled.bind( {} );
Controlled.args = {
	...Default.args,
};

export const ArbitrarySides = TemplateControlled.bind( {} );
ArbitrarySides.args = {
	...Default.args,
	sides: [ 'top', 'bottom' ],
};

export const SingleSide = TemplateControlled.bind( {} );
SingleSide.args = {
	...Default.args,
	sides: [ 'bottom' ],
};

export const AxialControls = TemplateControlled.bind( {} );
AxialControls.args = {
	...Default.args,
	splitOnAxis: true,
};

export const AxialControlsWithSingleSide = TemplateControlled.bind( {} );
AxialControlsWithSingleSide.args = {
	...Default.args,
	sides: [ 'horizontal' ],
	splitOnAxis: true,
};

export const ControlWithPresets = TemplateControlled.bind( {} );
ControlWithPresets.args = {
	...Default.args,
	presets: [
		{ name: 'Small', slug: 'small', value: '4px' },
		{ name: 'Medium', slug: 'medium', value: '8px' },
		{ name: 'Large', slug: 'large', value: '12px' },
		{ name: 'Extra Large', slug: 'extra-large', value: '16px' },
	],
	presetKey: 'padding',
};
