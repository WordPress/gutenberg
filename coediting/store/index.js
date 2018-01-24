/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { get, has, omit, omitBy, some } from 'lodash';

const colors = [ 'red', 'purple', 'orange', 'yellow', 'green' ];

const pickColor = () => {
	return colors[ Math.floor( Math.random() * colors.length ) ];
};

export const REDUCER_KEY = 'core/coediting';

/**
 * Reducer returning frozen blocks state when coediting.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export const blocks = ( state = {}, action ) => {
	const collaboratorId = get( action, 'meta.collaboratorId', null );
	const isCurrentCollaborator = value => value === collaboratorId;

	if ( ! collaboratorId ) {
		return state;
	}

	switch ( action.type ) {
		case 'COEDITING_BLOCKS_UNFREEZE':
			if ( ! some( state, isCurrentCollaborator ) ) {
				return state;
			}

			return omitBy( state, isCurrentCollaborator );
		case 'COEDITING_FREEZE_BLOCK':
			if ( state[ action.uid ] === collaboratorId ) {
				return state;
			}

			return {
				...omitBy( state, isCurrentCollaborator ),
				[ action.uid ]: collaboratorId,
			};
	}
	return state;
};

/**
 * Reducer returning collaborators state when coediting.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export const collaborators = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'COEDITING_COLLABORATOR_ADD':
			return {
				...state,
				[ action.collaboratorId ]: {
					color: pickColor(),
					name: `User: ${ action.userId }`,
					userId: action.userId,
				},
			};
		case 'COEDITING_COLLABORATOR_REMOVE':
			if ( ! state[ action.collaboratorId ] ) {
				return state;
			}

			return omit( state, action.collaboratorId );
	}
	return state;
};

/**
 * Reducer returning coediting enabled state.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export const enabled = ( state = false, action ) => {
	switch ( action.type ) {
		case 'COEDITING_TOGGLE':
			return ! state;
	}
	return state;
};

export const reducer = combineReducers( {
	blocks,
	collaborators,
	enabled,
} );

/**
 * Returns an action object used to clear the freeze for blocks edited by the collaborator.
 *
 * @return {Object} Action object
 */
export function clearFrozenBlocks() {
	return {
		type: 'COEDITING_BLOCKS_UNFREEZE',
	};
}

/**
 * Returns an action object used to freeze the block edited by the collaborator.
 *
 * @param  {String} uid Block unique ID
 * @return {Object}     Action object
 */
export function freezeBlock( uid ) {
	return {
		type: 'COEDITING_FREEZE_BLOCK',
		uid,
	};
}

/**
 * Returns an action object used to enable/disable a coediting session.
 *
 * @return {Object} Action object
 */
export function toggleCoediting() {
	return {
		type: 'COEDITING_TOGGLE',
	};
}

const getFrozenBlockCollaboratorProp = prop =>
	( state, uid ) => {
		const collaboratorId = get( state, [ 'blocks', uid ], null );

		if ( collaboratorId === null ) {
			return null;
		}

		return get( state, [ 'collaborators', collaboratorId, prop ], null );
	};

/**
 * Returns a color assigned to the collaborator when block is frozen or null otherwise.
 *
 * @param {Object} state Global application state
 * @param {String} uid   Block unique ID
 *
 * @return {String|null} Color when block frozen, null otherwise
 */
export const getFrozenBlockCollaboratorColor = getFrozenBlockCollaboratorProp( 'color' );

/**
 * Returns a name assigned to the collaborator when block is frozen or null otherwise.
 *
 * @param {Object} state Global application state
 * @param {String} uid   Block unique ID
 *
 * @return {String|null}     Whether coediting is enabled
 */
export const getFrozenBlockCollaboratorName = getFrozenBlockCollaboratorProp( 'name' );

/**
 * Returns true when a block is frozen by the collaborator or false otherwise.
 *
 * @param {Object} state Global application state
 * @param {String} uid   Block unique ID
 *
 * @return {Boolean}     Whether block is frozen by collaborator
 */
export function isBlockFrozenByCollaborator( state, uid ) {
	return has( state, [ 'blocks', uid ], false );
}

/**
 * Returns true when coediting is enabled, or false otherwise.
 *
 * @param {Object} state Global application state
 *
 * @return {Boolean}     Whether coediting is enabled
 */
export function isCoeditingEnabled( state ) {
	return get( state, 'enabled', false );
}
