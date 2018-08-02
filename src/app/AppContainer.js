/** @format */
import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
	createBlockAction,
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
		createBlockAction: ( uid, block ) => {
			dispatch( createBlockAction( uid, block ) );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
