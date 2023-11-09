//@ts-nocheck
/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomSelect from '..';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components/CustomSelect',
	component: CustomSelect,
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof CustomSelect > = () => {
	return (
		<CustomSelect label="Label">
			<CustomSelect.Item value="Small">
				<span style={ { fontSize: '75%' } }>Small</span>
			</CustomSelect.Item>
			<CustomSelect.Item value="Default" />
			<CustomSelect.Item value="Large">
				<span style={ { fontSize: '150%' } }>Large</span>
			</CustomSelect.Item>
			<CustomSelect.Item value="Huge">
				<span style={ { fontSize: '200%' } }>Huge</span>
			</CustomSelect.Item>
		</CustomSelect>
	);
};

export const Default = Template.bind( {} );

const ControlledTemplate = () => {
	function renderValue( gravatar: string ) {
		const avatar = `https://gravatar.com/avatar?d=${ gravatar }`;
		return (
			<>
				<img
					style={ { maxHeight: '75px', marginRight: '10px' } }
					key={ avatar }
					src={ avatar }
					alt=""
					aria-hidden
				/>
				<div>{ gravatar }</div>
			</>
		);
	}

	const options = [ 'mystery-person', 'identicon', 'wavatar', 'retro' ];

	const [ value, setValue ] = useState();

	return (
		<>
			<CustomSelect
				label="Default Gravatars:"
				onChange={ ( nextValue ) => setValue( nextValue ) }
				size="large"
				value={ value }
				renderSelectedValue={ ( currentValue ) =>
					renderValue( currentValue )
				}
			>
				{ options.map( ( option ) => (
					<CustomSelect.Item key={ option } value={ option }>
						{ renderValue( option ) }
					</CustomSelect.Item>
				) ) }
			</CustomSelect>
		</>
	);
};

export const Controlled = ControlledTemplate.bind( {} );
