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
import { CustomSelect, CustomSelectItem } from '..';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2',
	component: CustomSelect,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CustomSelectItem,
	},
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { excludeDecorators: true },
		},
	},
	decorators: [
		( Story ) => (
			<div
				style={ {
					minHeight: '250px',
				} }
			>
				<Story />
			</div>
		),
	],
};
export default meta;

const Template: StoryFn< typeof CustomSelect > = () => {
	return (
		<CustomSelect label="Label" defaultValue="Default">
			<CustomSelectItem value="Small">
				<span style={ { fontSize: '75%' } }>Small</span>
			</CustomSelectItem>
			<CustomSelectItem value="Default">Default</CustomSelectItem>
			<CustomSelectItem value="Large">
				<span style={ { fontSize: '150%' } }>Large</span>
			</CustomSelectItem>
			<CustomSelectItem value="Huge">
				<span style={ { fontSize: '200%' } }>Huge</span>
			</CustomSelectItem>
		</CustomSelect>
	);
};

export const Default = Template.bind( {} );

const MultiSelectTemplate: StoryFn< typeof CustomSelect > = () => {
	function renderValue( value: string | string[] ) {
		if ( value.length === 0 ) return '0 colors selected';
		return <div>{ value.length } colors selected</div>;
	}

	const items = [
		'amber',
		'aquamarine',
		'flamingo pink',
		'lavendar',
		'maroon',
		'tangerine',
	];

	const [ value, setValue ] = useState< string | string[] >( [
		'lavendar',
		'tangerine',
	] );

	return (
		<CustomSelect
			onChange={ ( nextValue ) => setValue( nextValue ) }
			defaultValue={ value }
			label="Select Colors"
			renderSelectedValue={ ( currentValue ) =>
				renderValue( currentValue )
			}
		>
			{ items.map( ( item ) => (
				<CustomSelectItem key={ item } value={ item }>
					{ item }
				</CustomSelectItem>
			) ) }
		</CustomSelect>
	);
};

export const MultiSelect = MultiSelectTemplate.bind( {} );

const ControlledTemplate = () => {
	function renderValue( gravatar: string | string[] ) {
		const avatar = `https://gravatar.com/avatar?d=${ gravatar }`;
		return (
			<div style={ { display: 'flex', alignItems: 'center' } }>
				<img
					style={ { maxHeight: '75px', marginRight: '10px' } }
					key={ avatar }
					src={ avatar }
					alt=""
					aria-hidden
				/>
				<span>{ gravatar }</span>
			</div>
		);
	}

	const options = [ 'mystery-person', 'identicon', 'wavatar', 'retro' ];

	const [ value, setValue ] = useState< string | string[] >();

	return (
		<>
			<CustomSelect
				label="Default Gravatars"
				onChange={ ( nextValue ) => setValue( nextValue ) }
				value={ value }
				renderSelectedValue={ ( currentValue ) =>
					renderValue( currentValue )
				}
			>
				{ options.map( ( option ) => (
					<CustomSelectItem key={ option } value={ option }>
						{ renderValue( option ) }
					</CustomSelectItem>
				) ) }
			</CustomSelect>
		</>
	);
};

export const Controlled = ControlledTemplate.bind( {} );
