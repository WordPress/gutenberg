/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { upload, media } from '@wordpress/icons';
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import DropZone from '..';

const ICONS = { upload, media };

const meta: Meta< typeof DropZone > = {
	component: DropZone,
	id: 'components-dropzone',
	title: 'Components/Selection & Input/File Upload/DropZone',
	argTypes: {
		icon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
	},
	args: {
		onFilesDrop: fn(),
		onHTMLDrop: fn(),
		onDrop: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof DropZone > = ( props ) => {
	return (
		<div
			style={ {
				background: 'lightgray',
				padding: 32,
				position: 'relative',
			} }
		>
			Drop something here
			<DropZone { ...props } />
		</div>
	);
};

export const Default = Template.bind( {} );
