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
	const [ , setFontSize ] = useState();

	return (
		<CustomSelect
			label="Label"
			defaultValue="Select a size..."
			onChange={ ( selectedItem ) => setFontSize( selectedItem ) }
			size="large"
		>
			<CustomSelect.Item>
				<span style={ { fontSize: '75%' } }>Small</span>
			</CustomSelect.Item>
			<CustomSelect.Item>
				<span style={ { fontSize: '100%' } }>Default</span>
			</CustomSelect.Item>
			<CustomSelect.Item>
				<span style={ { fontSize: '150%' } }>Large</span>
			</CustomSelect.Item>
			<CustomSelect.Item>
				<span style={ { fontSize: '200%' } }>Huge</span>
			</CustomSelect.Item>
		</CustomSelect>
	);
};

export const Default = Template.bind( {} );

const AsValueTemplate: StoryFn< typeof CustomSelect > = () => {
	return (
		<CustomSelect label="Label" defaultValue="In my defense, I have none">
			<CustomSelect.Item value="If the story's over, why am I still writing pages?" />
			<CustomSelect.Item value="In my defense, I have none" />
			<CustomSelect.Item value="I was so ahead of the curve, the curve became a sphere" />
			<CustomSelect.Item value="Sometimes you just don't know the answer" />
			<CustomSelect.Item value="Are you really gonna talk about timing in times like these?" />
			<CustomSelect.Item value="This scene feels like what I once saw on a screen" />
			<CustomSelect.Item value="Everything you lose is a step you take" />
		</CustomSelect>
	);
};

export const AsValue = AsValueTemplate.bind( {} );

const AsChildrenTemplate = () => {
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
				size="large"
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

export const AsChildren = AsChildrenTemplate.bind( {} );
