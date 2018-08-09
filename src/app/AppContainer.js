/** @format */
import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
	parseBlocksAction
} from '../store/actions';
import MainApp from './MainApp';

const mapStateToProps = ( state ) => ( {
	...state,
} );

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		onChange: ( uid, attributes ) => {
			dispatch( updateBlockAttributes( uid, attributes ) );
		},
		focusBlockAction: ( uid ) => {
			dispatch( focusBlockAction( uid ) );
		},
		moveBlockUpAction: ( uid ) => {
			dispatch( moveBlockUpAction( uid ) );
		},
		moveBlockDownAction: ( uid ) => {
			dispatch( moveBlockDownAction( uid ) );
		},
		deleteBlockAction: ( uid ) => {
			dispatch( deleteBlockAction( uid ) );
		},
		parseBlocksAction: ( html ) => {
			dispatch( parseBlocksAction( html ));
		}

	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
