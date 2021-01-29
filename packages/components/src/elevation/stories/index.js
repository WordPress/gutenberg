/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';
/**
 * Internal dependencies
 */
import Elevation from '../index';
import View from '../../view';

export default {
	component: Elevation,
	title: 'Components/Elevation',
};

export const _default = () => {
	const value = number( 'value', 5 );

	return (
		<View
			css={ {
				padding: '20vh',
				position: 'relative',
				margin: '20vh auto 10vw',
				maxWidth: 400,
			} }
		>
			<Elevation isInteractive value={ value } />
		</View>
	);
};
