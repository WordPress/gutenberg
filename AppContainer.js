/** @format */
import { connect } from 'react-redux';
import MainApp from './MainApp';

const mapStateToProps = state => ( {
	content: state.content || 'Please Wait...',
} );

const mapDispatchToProps = dispatch => {
	return {
		testAction: () => {
			dispatch( testAction() );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
