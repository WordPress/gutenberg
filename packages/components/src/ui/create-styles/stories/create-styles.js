/**
 * Internal dependencies
 */
import { createStyleSystem } from '../index';

export default {
	title: 'G2 Components (Experimental)/Create Styles',
};

const { View, styled } = createStyleSystem( {
	baseStyles: {
		fontFamily: 'Georgia',
	},
} );

const Example = styled.div`
	background: #ddd;
`;

const App = () => {
	return (
		<View>
			<Example>Hello</Example>
		</View>
	);
};

export const _default = () => {
	return <App />;
};
