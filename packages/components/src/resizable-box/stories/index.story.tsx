import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import ResizableBox from '..';

const meta: Meta< typeof ResizableBox > = {
	tags: [ 'manifest' ],
	title: 'Components/Utilities/ResizableBox',
	id: 'components-resizablebox',
	component: ResizableBox,
	argTypes: {
		children: { control: false },
		enable: { control: 'object' },
		onResizeStop: { action: 'onResizeStop' },
		__experimentalShowTooltip: { control: 'boolean' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
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

/**
 * The resize size label is hidden by default. Enable it with
 * `__experimentalShowTooltip`, or toggle that control in Storybook.
 */
export const WithResizeTooltip = Template.bind( {} );
WithResizeTooltip.args = {
	...Default.args,
	__experimentalShowTooltip: true,
};
