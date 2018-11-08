/**
 * External dependencies
 */
import { isPlainObject, uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import { DEFAULT_CONTEXT, DEFAULT_STATUS } from './constants';

/**
 * Yields action objects used in signalling that a notice is to be created.
 *
 * @param {?string|WPNotice}       statusOrNotice        Notice status, or a
 *                                                       notice object.
 *                                                       Defaults to `info`.
 * @param {string}                 content               Notice message.
 * @param {?Object}                options               Notice options.
 * @param {?string}                options.context       Context under which to
 *                                                       group notice.
 * @param {?string}                options.id            Identifier for notice.
 *                                                       Automatically assigned
 *                                                       if not specified.
 * @param {?boolean}               options.isDismissible Whether the notice can
 *                                                       be dismissed by user.
 *                                                       Defaults to `true`.
 * @param {?Array<WPNoticeAction>} options.actions       User actions to be
 *                                                       presented with notice.
 */
export function* createNotice( statusOrNotice = DEFAULT_STATUS, content, options = {} ) {
	let status, __unstableHTML;

	if ( isPlainObject( statusOrNotice ) ) {
		// Support overloaded form `createNotice( notice: WPNotice )`.
		options = statusOrNotice;
		( { status = DEFAULT_STATUS, content, __unstableHTML } = options );
	} else {
		// Else consider the first argument the status type string.
		status = statusOrNotice;
	}

	const {
		isDismissible = true,
		context = DEFAULT_CONTEXT,
		id = uniqueId( context ),
		actions = [],
	} = options;

	yield { type: 'SPEAK', message: content };

	yield {
		type: 'CREATE_NOTICE',
		context,
		notice: {
			id,
			status,
			content,
			__unstableHTML,
			isDismissible,
			actions,
		},
	};
}

/**
 * Returns an action object used in signalling that a success notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param {string}  content Notice message.
 * @param {?Object} options Optional notice options.
 *
 * @return {Object} Action object.
 */
export function createSuccessNotice( content, options ) {
	return createNotice( 'success', content, options );
}

/**
 * Returns an action object used in signalling that an info notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param {string}  content Notice message.
 * @param {?Object} options Optional notice options.
 *
 * @return {Object} Action object.
 */
export function createInfoNotice( content, options ) {
	return createNotice( 'info', content, options );
}

/**
 * Returns an action object used in signalling that an error notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param {string}  content Notice message.
 * @param {?Object} options Optional notice options.
 *
 * @return {Object} Action object.
 */
export function createErrorNotice( content, options ) {
	return createNotice( 'error', content, options );
}

/**
 * Returns an action object used in signalling that a warning notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param {string}  content Notice message.
 * @param {?Object} options Optional notice options.
 *
 * @return {Object} Action object.
 */
export function createWarningNotice( content, options ) {
	return createNotice( 'warning', content, options );
}

/**
 * Returns an action object used in signalling that a notice is to be removed.
 *
 * @param {string}  id      Notice unique identifier.
 * @param {?string} context Optional context (grouping) in which the notice is
 *                          intended to appear. Defaults to default context.
 *
 * @return {Object} Action object.
 */
export function removeNotice( id, context = DEFAULT_CONTEXT ) {
	return {
		type: 'REMOVE_NOTICE',
		id,
		context,
	};
}
