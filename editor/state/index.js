/**
 * External dependencies
 */
import { applyMiddleware, createStore, combineReducers } from 'redux';
import optimist from 'redux-optimist';
import refx from 'refx';
import multi from 'redux-multi';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import effects from './effects';
import { mobileMiddleware } from '../utils/mobile';
import storePersist from './store-persist';
import { PREFERENCES_DEFAULTS } from './store-defaults';
import editor from './editor';
import currentPost from './current-post';
import preferences from './preferences';
import metaBoxes from './meta-boxes';
import notices from './notices';
import isTyping from './is-typing';
import saving from './saving';
import blockInsertionPoint from './block-insertion-point';
import blockSelection from './block-selection';
import reusableBlocks from './reusable-blocks';
import panel from './panel';
import hoveredBlock from './hovered-block';
import blocksMode from './blocks-mode';

const reducer = optimist( combineReducers( {
	editor,
	currentPost,
	isTyping,
	blockSelection,
	hoveredBlock,
	blocksMode,
	blockInsertionPoint,
	preferences,
	panel,
	saving,
	notices,
	metaBoxes,
	reusableBlocks,
} ) );

/**
 * Module constants
 */
const GUTENBERG_PREFERENCES_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;

/**
 * Creates a new instance of a Redux store.
 *
 * @param  {?*}          preloadedState Optional initial state
 * @return {Redux.Store}                Redux store
 */
function createReduxStore( preloadedState ) {
	const enhancers = [
		applyMiddleware( multi, refx( effects ) ),
		storePersist( {
			reducerKey: 'preferences',
			storageKey: GUTENBERG_PREFERENCES_KEY,
			defaults: PREFERENCES_DEFAULTS,
		} ),
		applyMiddleware( mobileMiddleware ),
	];

	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	const store = createStore( reducer, preloadedState, flowRight( enhancers ) );

	return store;
}

export default createReduxStore;
