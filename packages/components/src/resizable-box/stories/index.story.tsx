/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import ResizableBox from '..';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const meta: Meta< typeof ResizableBox > = {
	title: 'Components/Utilities/ResizableBox',
	id: 'components-resizablebox',
	component: ResizableBox,
	argTypes: {
		children: { control: false },
		enable: { control: 'object' },
		onResizeStop: { action: 'onResizeStop' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ResizableBox > = ( {
	onResizeStop,
	...props
} ) => {
	const [ { height, width }, setAttributes ] = useState( {
		height: 200,
		width: 400,
	} );

	return (
		<ResizableBox
			{ ...props }
			size={ {
				height,
				width,
			} }
			onResizeStop={ ( event, direction, elt, delta ) => {
				onResizeStop?.( event, direction, elt, delta );
				setAttributes( {
					height: height + delta.height,
					width: width + delta.width,
				} );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	children: (
		<div
			style={ {
				background: '#eee',
				display: 'flex',
				height: '100%',
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center',
			} }
		>
			Resize
		</div>
	),
};

/**
 * The `enable` prop can be used to disable resizing in specific directions.
 */
export const DisabledDirections = Template.bind( {} );
DisabledDirections.args = {
	...Default.args,
	enable: {
		top: false,
		right: true,
		bottom: true,
		left: false,
		topRight: false,
		bottomRight: true,
		bottomLeft: false,
		topLeft: false,
	},
};
