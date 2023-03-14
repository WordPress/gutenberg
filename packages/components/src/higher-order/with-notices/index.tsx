/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { forwardRef, useState, useMemo } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NoticeList from '../../notice/list';
import type { NoticeListProps } from '../../notice/types';

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
	function Component(
		props: { [ key: string ]: any },
		ref: React.ForwardedRef< any >
	) {
		const [ noticeList, setNoticeList ] = useState<
			NoticeListProps[ 'notices' ]
		>( [] );

		const noticeOperations = useMemo( () => {
			/**
			 * Function passed down as a prop that adds a new notice.
			 *
			 * @param notice Notice to add.
			 */
			const createNotice = ( notice: typeof noticeList[ number ] ) => {
				const noticeToAdd = notice.id
					? notice
					: { ...notice, id: uuid() };
				setNoticeList( ( current ) => [ ...current, noticeToAdd ] );
			};

			return {
				createNotice,

				/**
				 * Function passed as a prop that adds a new error notice.
				 *
				 * @param msg Error message of the notice.
				 */
				createErrorNotice: ( msg: string ) => {
					// @ts-expect-error TODO: Missing `id`, potentially a bug
					createNotice( {
						status: 'error',
						content: msg,
					} );
				},

				/**
				 * Removes a notice by id.
				 *
				 * @param id Id of the notice to remove.
				 */
				removeNotice: ( id: string ) => {
					setNoticeList( ( current ) =>
						current.filter( ( notice ) => notice.id !== id )
					);
				},

				/**
				 * Removes all notices
				 */
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

		return isForwardRef ? (
			<OriginalComponent { ...propsOut } ref={ ref } />
		) : (
			<OriginalComponent { ...propsOut } />
		);
	}

	let isForwardRef: boolean;
	// @ts-expect-error - `render` will only be present when OriginalComponent was wrapped with forwardRef().
	const { render } = OriginalComponent;
	// Returns a forwardRef if OriginalComponent appears to be a forwardRef.
	if ( typeof render === 'function' ) {
		isForwardRef = true;
		return forwardRef( Component );
	}
	return Component;
}, 'withNotices' );
