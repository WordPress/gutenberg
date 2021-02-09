/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';
/**
 * Internal dependencies
 */
import { Elevation } from '../index';
import { View } from '../../view';

export default {
	component: Elevation,
	title: 'G2 Components (Experimental)/Elevation',
};

export const _default = () => {
	const value = number( 'value', 5 );
	const hover = number( 'hover', undefined );
	const focus = number( 'focus', undefined );
	const active = number( 'active', undefined );

	return (
		<View
			css={ {
				padding: '20vh',
				position: 'relative',
				margin: '20vh auto 10vw',
				maxWidth: 400,
			} }
		>
			<Elevation
				isInteractive
				value={ value }
				hover={ hover }
				focus={ focus }
				active={ active }
			/>
		</View>
	);
};
