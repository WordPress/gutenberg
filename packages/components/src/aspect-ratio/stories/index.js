/**
 * External dependencies
 */
import { select } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { AspectRatio } from '../index';

export default {
	component: AspectRatio,
	title: 'Components (Experimental)/AspectRatio',
};

export const _default = () => {
	const props = {
		ratio: select(
			'ratio',
			{
				'wide (16/9)': 16 / 9,
				'standard (4/3)': 4 / 3,
				'vertical (9/16)': 9 / 16,
			},
			16 / 9
		),
	};
	return (
		<AspectRatio width={ '400px' } { ...props }>
			<img alt="random" src="https://cldup.com/cXyG__fTLN.jpg" />
		</AspectRatio>
	);
};
