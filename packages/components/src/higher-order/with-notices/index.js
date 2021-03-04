/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { forwardRef, useState, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NoticeList from '../../notice/list';

/**
 * Override the default edit UI to include notices if supported.
 *
 * @param  {WPComponent} OriginalComponent Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export default createHigherOrderComponent( ( OriginalComponent ) => {
	function Component( props, ref ) {
		const [ noticeList, setNoticeList ] = useState( [] );

		/**
		 * Function passed down as a prop that adds a new notice.
		 *
		 * @param {Object} notice  Notice to add.
		 */
		const createNotice = useCallback( ( notice ) => {
			const noticeToAdd = notice.id ? notice : { ...notice, id: uuid() };
			setNoticeList( ( current ) => [ ...current, noticeToAdd ] );
		}, [] );

		/**
		 * Function passed as a prop that adds a new error notice.
		 *
		 * @param {string} msg  Error message of the notice.
		 */
		const createErrorNotice = useCallback(
			( msg ) => {
				createNotice( {
					status: 'error',
					content: msg,
				} );
			},
			[ createNotice ]
		);

		/**
		 * Removes a notice by id.
		 *
		 * @param {string} id  Id of the notice to remove.
		 */
		const removeNotice = useCallback( ( id ) => {
			setNoticeList( ( current ) =>
				current.filter( ( notice ) => notice.id !== id )
			);
		}, [] );

		/**
		 * Removes all notices
		 */
		const removeAllNotices = useCallback( () => {
			setNoticeList( [] );
		}, [] );

		const noticeOperations = {
			createNotice,
			createErrorNotice,
			removeNotice,
			removeAllNotices,
		};

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

	let isForwardRef;
	const { render } = OriginalComponent;
	// Returns a forwardRef if OriginalComponent appears to be a forwardRef
	if ( typeof render === 'function' ) {
		isForwardRef = true;
		return forwardRef( Component );
	}
	return Component;
} );
