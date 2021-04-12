/**
 * Internal dependencies
 */
import { createStyleSystem } from '../index';

export default {
	title: 'G2 Components (Experimental)/String Interpolation',
};

const { View, styled } = createStyleSystem( {
	baseStyles: {
		boxSizing: 'border-box',
		fontFamily: 'Arial',
	},
} );

const happyMixin = ( props ) => {
	return props.happy ? `color: green` : `color: blue`;
};

const niceMixin = ( props ) => {
	return props.nice ? `background-color: yellow` : `background-color: #ddd`;
};

const FriendlyExample = styled.div`
	color: #aaa;
	${ happyMixin };
	${ niceMixin };
	font-size: 40px;
	font-weight: bold;
	padding: 20px;
	${ ( props ) => props.title && `font-size: 90px` }
`;

const App = () => {
	return (
		<View>
			<FriendlyExample happy={ false } nice={ false } title="Weee">
				Hello
			</FriendlyExample>
		</View>
	);
};

export const _default = () => {
	return <App />;
};
