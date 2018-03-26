/** @format */
import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
} from './store/actions';
import MainApp from './MainApp';

const mapStateToProps = state => ( {
	...state,
} );

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		onChange: ( uid, attributes ) => {
			dispatch( updateBlockAttributes( uid, attributes ) );
		},
		focusBlockAction: index => {
			dispatch( focusBlockAction( index ) );
		},
		moveBlockUpAction: index => {
			dispatch( moveBlockUpAction( index ) );
		},
		moveBlockDownAction: index => {
			dispatch( moveBlockDownAction( index ) );
		},
		deleteBlockAction: index => {
			dispatch( deleteBlockAction( index ) );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
