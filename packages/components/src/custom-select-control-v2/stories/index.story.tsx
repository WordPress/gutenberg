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
import { CustomSelect, CustomSelectItem } from '..';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControlV2',
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
		// Layout wrapper
		( Story ) => (
			<div
				style={ {
					minHeight: '300px',
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
		<CustomSelect label="Label">
			<CustomSelectItem value="Small">
				<span style={ { fontSize: '75%' } }>Small</span>
			</CustomSelectItem>
			<CustomSelectItem value="Default" />
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
				styledValue={ ( currentValue ) => renderValue( currentValue ) }
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
