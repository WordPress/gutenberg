/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Scrollable } from '..';

const meta: Meta< typeof Scrollable > = {
	component: Scrollable,
	title: 'Components (Experimental)/Scrollable',
	argTypes: {
		as: {
			control: { type: 'text' },
		},
		children: {
			control: { type: null },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Scrollable > = ( { ...args } ) => {
	const targetRef = useRef< HTMLInputElement >( null );

	const onButtonClick = () => {
		targetRef.current?.focus();
	};

	const containerWidth = 300;
	const containerHeight = 400;

	return (
		<Scrollable
			style={ { height: containerHeight, width: containerWidth } }
			{ ...args }
		>
			<View
				style={ {
					backgroundColor: '#eee',
					height:
						args.scrollDirection === 'x' ? containerHeight : 1000,
					width: args.scrollDirection === 'y' ? containerWidth : 1000,
					position: 'relative',
				} }
			>
				<button onClick={ onButtonClick }>
					Move focus to an element out of view
				</button>
				<input
					ref={ targetRef }
					style={ {
						position: 'absolute',
						bottom: args.scrollDirection === 'x' ? 'initial' : 0,
						right: 0,
					} }
					type="text"
					value="Focus me"
				/>
			</View>
		</Scrollable>
	);
};

export const Default: StoryFn< typeof Scrollable > = Template.bind( {} );
Default.args = {
	smoothScroll: false,
	scrollDirection: 'y',
};
