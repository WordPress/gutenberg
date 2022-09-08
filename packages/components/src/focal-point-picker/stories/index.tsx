/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import FocalPointPicker from '..';

const meta: ComponentMeta< typeof FocalPointPicker > = {
	title: 'Components/FocalPointPicker',
	component: FocalPointPicker,
	argTypes: {
		help: { control: 'text' },
		label: { control: 'text' },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof FocalPointPicker > = ( {
	onChange,
	...props
} ) => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.5,
	} );

	return (
		<FocalPointPicker
			{ ...props }
			value={ focalPoint }
			onChange={ ( ...changeArgs ) => {
				onChange( ...changeArgs );
				setFocalPoint( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );

export const Image = Template.bind( {} );
Image.args = {
	...Default.args,
	url: 'https://i0.wp.com/themes.svn.wordpress.org/twentytwenty/1.3/screenshot.png?w=572&strip=al',
};

export const Video = Template.bind( {} );
Video.args = {
	...Default.args,
	url: 'https://interactive-examples.mdn.mozilla.net/media/examples/flower.webm',
};

export const Snapping = Template.bind( {} );
Snapping.args = {
	...Default.args,
	resolvePoint: ( value ) => {
		const snapValues = {
			x: [ 0, 0.33, 0.66, 1 ],
			y: [ 0, 0.33, 0.66, 1 ],
		};

		const threshold = 0.05;

		let x = value.x;
		let y = value.y;

		snapValues.x.forEach( ( snapValue ) => {
			if ( snapValue - threshold < x && x < snapValue + threshold ) {
				x = snapValue;
			}
		} );

		snapValues.y.forEach( ( snapValue ) => {
			if ( snapValue - threshold < y && y < snapValue + threshold ) {
				y = snapValue;
			}
		} );

		return { x, y };
	},
};
