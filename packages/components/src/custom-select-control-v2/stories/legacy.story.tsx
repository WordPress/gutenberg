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
import CustomSelect from '../legacy-component';
import * as V1Story from '../../custom-select-control/stories/index.story';

const meta: Meta< typeof CustomSelect > = {
	title: 'Components (Experimental)/CustomSelectControl v2/Legacy',
	component: CustomSelect,
	argTypes: {
		onChange: { control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		badges: [ 'wip' ],
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			source: { excludeDecorators: true },
		},
	},
	decorators: [
		( Story ) => (
			<div
				style={ {
					minHeight: '150px',
				} }
			>
				<Story />
			</div>
		),
	],
};
export default meta;

const Template: StoryFn< typeof CustomSelect > = ( props ) => {
	const [ value, setValue ] = useState( props.options[ 0 ] );

	const onChange: React.ComponentProps<
		typeof CustomSelect
	>[ 'onChange' ] = ( changeObject ) => {
		setValue( changeObject.selectedItem );
		props.onChange?.( changeObject );
	};

	return <CustomSelect { ...props } onChange={ onChange } value={ value } />;
};

export const Default = Template.bind( {} );
Default.args = V1Story.Default.args;

export const WithLongLabels = Template.bind( {} );
WithLongLabels.args = V1Story.WithLongLabels.args;

export const WithHints = Template.bind( {} );
WithHints.args = V1Story.WithHints.args;
