/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RotationRuler from '../index';
import '../style.scss';

const meta: Meta< typeof RotationRuler > = {
	title: 'MediaEditor/RotationRuler',
	component: RotationRuler,
	args: {
		label: __( 'Fine rotation' ),
		min: -45,
		max: 45,
		step: 1,
		pixelsPerStep: 6,
		disabled: false,
	},
	argTypes: {
		value: { control: false },
		onChange: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof RotationRuler >;

export const Default: Story = {
	render: ( args ) => {
		const [ value, setValue ] = useState( 0 );
		return (
			<div style={ { width: 360, color: '#1e1e1e' } }>
				<RotationRuler
					{ ...args }
					value={ value }
					onChange={ setValue }
				/>
				<p style={ { marginTop: 16 } }>
					{ __( 'Current value:' ) } { value }°
				</p>
			</div>
		);
	},
};
