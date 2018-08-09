/** @format */
import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
	parseBlocksAction,
} from '../store/actions';
import MainApp from './MainApp';

const mapStateToProps = ( state, parser ) => ( {
	...state,
	parser: parser,
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
		parseBlocksAction: ( html, parser ) => {
			dispatch( parseBlocksAction( html, parser ) );
		},

	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
