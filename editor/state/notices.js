/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	partial,
	findIndex,
} from 'lodash';

/**
 * Reducer
 */

export default function( state = [], action ) {
	switch ( action.type ) {
		case 'CREATE_NOTICE':
			return [ ...state, action.notice ];

		case 'REMOVE_NOTICE':
			const { noticeId } = action;
			const index = findIndex( state, { id: noticeId } );
			if ( index === -1 ) {
				return state;
			}

			return [
				...state.slice( 0, index ),
				...state.slice( index + 1 ),
			];
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object used to create a notice
 *
 * @param {String}     status   The notice status
 * @param {WPElement}  content  The notice content
 * @param {?Object}    options  The notice options.  Available options:
 *                              `id` (string; default auto-generated)
 *                              `isDismissible` (boolean; default `true`)
 *
 * @return {Object}             Action object
 */
export function createNotice( status, content, options = {} ) {
	const {
		id = uuid(),
		isDismissible = true,
	} = options;
	return {
		type: 'CREATE_NOTICE',
		notice: {
			id,
			status,
			content,
			isDismissible,
		},
	};
}

export const createSuccessNotice = partial( createNotice, 'success' );
export const createInfoNotice = partial( createNotice, 'info' );
export const createErrorNotice = partial( createNotice, 'error' );
export const createWarningNotice = partial( createNotice, 'warning' );

/**
 * Returns an action object used to remove a notice
 *
 * @param {String}  id  The notice id
 *
 * @return {Object}     Action object
 */
export function removeNotice( id ) {
	return {
		type: 'REMOVE_NOTICE',
		noticeId: id,
	};
}

/**
 * Selectors
 */

/**
 * Returns the user notices array
 *
 * @param {Object} state Global application state
 * @return {Array}       List of notices
 */
export function getNotices( state ) {
	return state.notices;
}
