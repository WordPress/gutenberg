/** @format */
import { connect } from 'react-redux';
import { focusBlockAction } from './store/actions';
import MainApp from './MainApp';

const mapStateToProps = state => ( {
	...state,
} );

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		focusBlockAction: index => {
			dispatch( focusBlockAction( index ) );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
