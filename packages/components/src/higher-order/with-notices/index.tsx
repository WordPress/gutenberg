/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NoticeList from '../../notice/list';
import type { WithNoticeProps } from './types';

/**
 * Override the default edit UI to include notices if supported.
 *
 * Wrapping the original component with `withNotices` encapsulates the component
 * with the additional props `noticeOperations` and `noticeUI`.
 *
 * ```jsx
 * import { withNotices, Button } from '@wordpress/components';
 *
 * const MyComponentWithNotices = withNotices(
 * 	( { noticeOperations, noticeUI } ) => {
 * 		const addError = () =>
 * 			noticeOperations.createErrorNotice( 'Error message' );
 * 		return (
 * 			<div>
 * 				{ noticeUI }
 * 				<Button variant="secondary" onClick={ addError }>
 * 					Add error
 * 				</Button>
 * 			</div>
 * 		);
 * 	}
 * );
 * ```
 *
 * @param OriginalComponent Original component.
 *
 * @return Wrapped component.
 */
export default createHigherOrderComponent( ( OriginalComponent ) => {
	return function Component( props: { [ key: string ]: any } ) {
		const [ noticeList, setNoticeList ] = useState<
			WithNoticeProps[ 'noticeList' ]
		>( [] );

		const noticeOperations = useMemo<
			WithNoticeProps[ 'noticeOperations' ]
		>( () => {
			const createNotice: WithNoticeProps[ 'noticeOperations' ][ 'createNotice' ] =
				( notice ) => {
					const noticeToAdd = notice.id
						? notice
						: { ...notice, id: uuid() };
					setNoticeList( ( current ) => [ ...current, noticeToAdd ] );
				};

			return {
				createNotice,
				createErrorNotice: ( msg ) => {
					// @ts-expect-error TODO: Missing `id`, potentially a bug
					createNotice( {
						status: 'error',
						content: msg,
					} );
				},
				removeNotice: ( id ) => {
					setNoticeList( ( current ) =>
						current.filter( ( notice ) => notice.id !== id )
					);
				},
				removeAllNotices: () => {
					setNoticeList( [] );
				},
			};
		}, [] );

		const propsOut = {
			...props,
			noticeList,
			noticeOperations,
			noticeUI: noticeList.length > 0 && (
				<NoticeList
					className="components-with-notices-ui"
					notices={ noticeList }
					onRemove={ noticeOperations.removeNotice }
				/>
			),
		};

		return <OriginalComponent { ...propsOut } />;
	};
}, 'withNotices' );
