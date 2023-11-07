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
			<CustomSelect.Item style={ { fontSize: '50%' } } value="small">
				Small
			</CustomSelect.Item>
			<CustomSelect.Item
				className="can-apply-custom-class-to-option"
				style={ { fontSize: '100%' } }
				value="default"
			>
				Default
			</CustomSelect.Item>
			<CustomSelect.Item style={ { fontSize: '200%' } } value="large">
				Large
			</CustomSelect.Item>
			<CustomSelect.Item style={ { fontSize: '300%' } } value="huge">
				Huge
			</CustomSelect.Item>
		</CustomSelect>
	);
};

export const Default = Template.bind( {} );

const RenderChildrenTemplate = () => {
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

	const [ value, setValue ] = useState( 'mystery-person' );

	return (
		<>
			<CustomSelect
				label="Default Gravatars:"
				defaultValue={ renderValue( value ) }
				onChange={ ( nextValue: any ) => setValue( nextValue ) }
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

export const RenderChildren = RenderChildrenTemplate.bind( {} );
