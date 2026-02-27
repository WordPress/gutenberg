/**
 * Internal dependencies
 */
import { DEFAULT_CONTEXT, DEFAULT_STATUS } from './constants';
import type { NoticeOptions, ReducerAction } from './types';

let uniqueId = 0;

/**
 * Returns an action object used in signalling that a notice is to be created.
 *
 * @param status  Notice status ("info" if undefined is passed).
 * @param content Notice message.
 * @param options Optional notice options.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     const { createNotice } = useDispatch( noticesStore );
 *     return (
 *         <Button
 *             onClick={ () => createNotice( 'success', __( 'Notice message' ) ) }
 *         >
 *             { __( 'Generate a success notice!' ) }
 *         </Button>
 *     );
 * };
 * ```
 *
 * @return Action object.
 */
export function createNotice(
	status = DEFAULT_STATUS,
	content: string,
	options: NoticeOptions = {}
): Extract< ReducerAction, { type: 'CREATE_NOTICE' } > {
	const {
		speak = true,
		isDismissible = true,
		context = DEFAULT_CONTEXT,
		id = `${ context }${ ++uniqueId }`,
		actions = [],
		type = 'default',
		__unstableHTML,
		icon = null,
		explicitDismiss = false,
		onDismiss,
	} = options;

	// The supported value shape of content is currently limited to plain text
	// strings. To avoid setting expectation that e.g. a React Element could be
	// supported, cast to a string.
	content = String( content );

	return {
		type: 'CREATE_NOTICE',
		context,
		notice: {
			id,
			status,
			content,
			spokenMessage: speak ? content : null,
			__unstableHTML,
			isDismissible,
			actions,
			type,
			icon,
			explicitDismiss,
			onDismiss,
		},
	};
}

/**
 * Returns an action object used in signalling that a success notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param content Notice message.
 * @param options Optional notice options.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     const { createSuccessNotice } = useDispatch( noticesStore );
 *     return (
 *         <Button
 *             onClick={ () =>
 *                 createSuccessNotice( __( 'Success!' ), {
 *                     type: 'snackbar',
 *                     icon: '🔥',
 *                 } )
 *             }
 *         >
 *             { __( 'Generate a snackbar success notice!' ) }
 *        </Button>
 *     );
 * };
 * ```
 *
 * @return Action object.
 */
export function createSuccessNotice(
	content: string,
	options?: NoticeOptions
) {
	return createNotice( 'success', content, options );
}

/**
 * Returns an action object used in signalling that an info notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param content Notice message.
 * @param options Optional notice options.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     const { createInfoNotice } = useDispatch( noticesStore );
 *     return (
 *         <Button
 *             onClick={ () =>
 *                createInfoNotice( __( 'Something happened!' ), {
 *                   isDismissible: false,
 *                } )
 *             }
 *         >
 *         { __( 'Generate a notice that cannot be dismissed.' ) }
 *       </Button>
 *       );
 * };
 *```
 *
 * @return Action object.
 */
export function createInfoNotice( content: string, options?: NoticeOptions ) {
	return createNotice( 'info', content, options );
}

/**
 * Returns an action object used in signalling that an error notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param content Notice message.
 * @param options Optional notice options.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     const { createErrorNotice } = useDispatch( noticesStore );
 *     return (
 *         <Button
 *             onClick={ () =>
 *                 createErrorNotice( __( 'An error occurred!' ), {
 *                     type: 'snackbar',
 *                     explicitDismiss: true,
 *                 } )
 *             }
 *         >
 *             { __(
 *                 'Generate a snackbar error notice with explicit dismiss button.'
 *             ) }
 *         </Button>
 *     );
 * };
 * ```
 *
 * @return Action object.
 */
export function createErrorNotice( content: string, options?: NoticeOptions ) {
	return createNotice( 'error', content, options );
}

/**
 * Returns an action object used in signalling that a warning notice is to be
 * created. Refer to `createNotice` for options documentation.
 *
 * @see createNotice
 *
 * @param content Notice message.
 * @param options Optional notice options.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     const { createWarningNotice, createInfoNotice } = useDispatch( noticesStore );
 *     return (
 *         <Button
 *             onClick={ () =>
 *                 createWarningNotice( __( 'Warning!' ), {
 *                     onDismiss: () => {
 *                         createInfoNotice(
 *                             __( 'The warning has been dismissed!' )
 *                         );
 *                     },
 *                 } )
 *             }
 *         >
 *             { __( 'Generates a warning notice with onDismiss callback' ) }
 *         </Button>
 *     );
 * };
 * ```
 *
 * @return Action object.
 */
export function createWarningNotice(
	content: string,
	options?: NoticeOptions
) {
	return createNotice( 'warning', content, options );
}

/**
 * Returns an action object used in signalling that a notice is to be removed.
 *
 * @param id      Notice unique identifier.
 * @param context Optional context (grouping) in which the notice is
 *                intended to appear. Defaults to 'default' context.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *    const notices = useSelect( ( select ) => select( noticesStore ).getNotices() );
 *    const { createWarningNotice, removeNotice } = useDispatch( noticesStore );
 *
 *    return (
 *         <>
 *             <Button
 *                 onClick={ () =>
 *                     createWarningNotice( __( 'Warning!' ), {
 *                         isDismissible: false,
 *                     } )
 *                 }
 *             >
 *                 { __( 'Generate a notice' ) }
 *             </Button>
 *             { notices.length > 0 && (
 *                 <Button onClick={ () => removeNotice( notices[ 0 ].id ) }>
 *                     { __( 'Remove the notice' ) }
 *                 </Button>
 *             ) }
 *         </>
 *     );
 *};
 * ```
 *
 * @return Action object.
 */
export function removeNotice(
	id: string,
	context: string = DEFAULT_CONTEXT
): Extract< ReducerAction, { type: 'REMOVE_NOTICE' } > {
	return {
		type: 'REMOVE_NOTICE',
		id,
		context,
	};
}

/**
 * Removes all notices from a given context. Defaults to the default context.
 *
 * @param noticeType The context to remove all notices from.
 * @param context    The optional context to remove all notices from.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch, useSelect } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * export const ExampleComponent = () => {
 * 	const notices = useSelect( ( select ) =>
 * 		select( noticesStore ).getNotices()
 * 	);
 * 	const { removeAllNotices } = useDispatch( noticesStore );
 * 	return (
 * 		<>
 * 			<ul>
 * 				{ notices.map( ( notice ) => (
 * 					<li key={ notice.id }>{ notice.content }</li>
 * 				) ) }
 * 			</ul>
 * 			<Button
 * 				onClick={ () =>
 * 					removeAllNotices()
 * 				}
 * 			>
 * 				{ __( 'Clear all notices', 'woo-gutenberg-products-block' ) }
 * 			</Button>
 * 			<Button
 * 				onClick={ () =>
 * 					removeAllNotices( 'snackbar' )
 * 				}
 * 			>
 * 				{ __( 'Clear all snackbar notices', 'woo-gutenberg-products-block' ) }
 * 			</Button>
 * 		</>
 * 	);
 * };
 * ```
 *
 * @return 	   Action object.
 */
export function removeAllNotices(
	noticeType = 'default',
	context: string = DEFAULT_CONTEXT
): Extract< ReducerAction, { type: 'REMOVE_ALL_NOTICES' } > {
	return {
		type: 'REMOVE_ALL_NOTICES',
		noticeType,
		context,
	};
}

/**
 * Returns an action object used in signalling that several notices are to be removed.
 *
 * @param ids     List of unique notice identifiers.
 * @param context Optional context (grouping) in which the notices are
 *                intended to appear. Defaults to 'default' context.
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch, useSelect } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 * 	const notices = useSelect( ( select ) =>
 * 		select( noticesStore ).getNotices()
 * 	);
 * 	const { removeNotices } = useDispatch( noticesStore );
 * 	return (
 * 		<>
 * 			<ul>
 * 				{ notices.map( ( notice ) => (
 * 					<li key={ notice.id }>{ notice.content }</li>
 * 				) ) }
 * 			</ul>
 * 			<Button
 * 				onClick={ () =>
 * 					removeNotices( notices.map( ( { id } ) => id ) )
 * 				}
 * 			>
 * 				{ __( 'Clear all notices' ) }
 * 			</Button>
 * 		</>
 * 	);
 * };
 * ```
 * @return Action object.
 */
export function removeNotices(
	ids: Array< string >,
	context: string = DEFAULT_CONTEXT
): Extract< ReducerAction, { type: 'REMOVE_NOTICES' } > {
	return {
		type: 'REMOVE_NOTICES',
		ids,
		context,
	};
}
