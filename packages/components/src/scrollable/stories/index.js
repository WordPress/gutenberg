/**
 * External dependencies
 */
import { boolean, select } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Scrollable } from '../';

export default {
	component: Scrollable,
	title: 'Components (Experimental)/Scrollable',
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const targetRef = useRef( null );

	const onButtonClick = () => {
		targetRef.current?.focus();
	};

	const otherProps = {
		smoothScroll: boolean(
			'Scrollable: smoothScroll (hint: move focus in the scrollable container)',
			false
		),
		scrollDirection: select(
			'Scrollable: scrollDirection',
			{
				x: 'x',
				y: 'y',
				auto: 'auto',
			},
			'y'
		),
	};

	const containerWidth = 300;
	const containerHeight = 400;

	return (
		<Scrollable
			style={ { height: containerHeight, width: containerWidth } }
			{ ...otherProps }
		>
			<View
				style={ {
					backgroundColor: '#eee',
					height:
						otherProps.scrollDirection === 'x'
							? containerHeight
							: 1000,
					width:
						otherProps.scrollDirection === 'y'
							? containerWidth
							: 1000,
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
						bottom:
							otherProps.scrollDirection === 'x' ? 'initial' : 0,
						right:
							otherProps.scrollDirection === 'y' ? 'initial' : 0,
					} }
					type="text"
					value="Focus me"
				/>
			</View>
		</Scrollable>
	);
};
