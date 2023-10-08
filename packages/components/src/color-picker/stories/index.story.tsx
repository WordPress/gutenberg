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
import { ColorPicker } from '../component';
import Dropdown from '../../dropdown';
import DropdownContentWrapper from '../../dropdown/dropdown-content-wrapper';

const meta: Meta< typeof ColorPicker > = {
	component: ColorPicker,
	title: 'Components/ColorPicker',
	argTypes: {
		as: { control: { type: null } },
		color: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ColorPicker > = ( { onChange, ...props } ) => {
	const [ color, setColor ] = useState< string | undefined >();

	return (
		<ColorPicker
			{ ...props }
			color={ color }
			onChange={ ( ...changeArgs ) => {
				onChange?.( ...changeArgs );
				setColor( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );

export const WithDropdown: StoryFn< typeof ColorPicker > = ( {
	onChange,
	...props
} ) => {
	const [ color, setColor ] = useState< string | undefined >();

	return (
		<div style={ { width: '100%', height: '600px', position: 'relative' } }>
			<Dropdown
				renderContent={ () => (
					<DropdownContentWrapper paddingSize="none">
						<ColorPicker
							{ ...props }
							color={ color }
							onChange={ ( ...changeArgs ) => {
								onChange?.( ...changeArgs );
								setColor( ...changeArgs );
							} }
						/>
					</DropdownContentWrapper>
				) }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button
						onClick={ onToggle }
						style={ {
							marginLeft: '100px',
							marginTop: '100px',
							zIndex: 1,
							position: 'relative',
						} }
					>
						{ isOpen ? 'Close' : 'Open' }
					</button>
				) }
				popoverProps={ {
					resize: false,
					placement: 'right-start',
				} }
			/>
			<iframe
				style={ {
					position: 'absolute',
					top: 0,
					left: 0,
					height: '100%',
					width: '100%',
					zIndex: 0,
				} }
				title="test"
			/>
		</div>
	);
};
