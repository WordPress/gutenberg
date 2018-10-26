/** @flow
 * @format */

import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
	createBlockAction,
	parseBlocksAction,
	serializeToNativeAction,
} from '../store/actions';
import MainApp from './MainApp';

const mapStateToProps = ( state ) => ( {
	...state,
} );

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		onChange: ( clientId, attributes ) => {
			dispatch( updateBlockAttributes( clientId, attributes ) );
		},
		focusBlockAction: ( clientId ) => {
			dispatch( focusBlockAction( clientId ) );
		},
		moveBlockUpAction: ( clientId ) => {
			dispatch( moveBlockUpAction( clientId ) );
		},
		moveBlockDownAction: ( clientId ) => {
			dispatch( moveBlockDownAction( clientId ) );
		},
		deleteBlockAction: ( clientId ) => {
			dispatch( deleteBlockAction( clientId ) );
		},
		createBlockAction: ( clientId, block, clientIdAbove ) => {
			dispatch( createBlockAction( clientId, block, clientIdAbove ) );
		},
		parseBlocksAction: ( html ) => {
			dispatch( parseBlocksAction( html ) );
		},
		serializeToNativeAction: () => {
			dispatch( serializeToNativeAction() );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );
export default AppContainer;
