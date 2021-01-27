/**
 * Internal dependencies
 */
import View from '../../view';
import Grid from '../index';

export default {
	component: Grid,
	title: 'Components/Grid',
};

export const _default = () => {
	return (
		<Grid alignment="bottom" columns={ [ 1, 2, 4 ] }>
			<View>One</View>
			<View>Two</View>
			<View>Three</View>
			<View>Four</View>
		</Grid>
	);
};
