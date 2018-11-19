/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import { DEFAULT_CONTEXT, DEFAULT_STATUS } from './constants';

/**
 * Yields action objects used in signalling that a notice is to be created.
 *
 * @param {?string}                status                Notice status.
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
 * @param {?boolean}               options.speak         Whether the notice
 *                                                       content should be
 *                                                       announced to screen
 *                                                       readers. Defaults to
 *                                                       `true`.
 * @param {?Array<WPNoticeAction>} options.actions       User actions to be
 *                                                       presented with notice.
 */
export function* createNotice( status = DEFAULT_STATUS, content, options = {} ) {
	const {
		speak = true,
		isDismissible = true,
		context = DEFAULT_CONTEXT,
		id = uniqueId( context ),
		actions = [],
		__unstableHTML,
	} = options;

	// The supported value shape of content is currently limited to plain text
	// strings. To avoid setting expectation that e.g. a WPElement could be
	// supported, cast to a string.
	content = String( content );

	if ( speak ) {
		yield { type: 'SPEAK', message: content };
	}

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
