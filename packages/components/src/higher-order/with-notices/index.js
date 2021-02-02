/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
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
	let isForwardRef;
	const { render } = OriginalComponent;
	// Returns a forwardRef if OriginalComponent is a forwardRef
	if ( typeof render === 'function' && render.length === 2 ) {
		isForwardRef = true;
		return forwardRef( Component );
	}
	return Component;

	function Component( props, ref ) {
		const [ noticeList, setNoticeList ] = useState( [] );

		const noticeOperations = {
			/**
			 * Function passed down as a prop that adds a new notice.
			 *
			 * @param {Object} notice  Notice to add.
			 */
			createNotice: ( notice ) => {
				const noticeToAdd = notice.id
					? notice
					: { ...notice, id: uuid() };
				setNoticeList( ( current ) => [ ...current, noticeToAdd ] );
			},

			/**
			 * Function passed as a prop that adds a new error notice.
			 *
			 * @param {string} msg  Error message of the notice.
			 */
			createErrorNotice: ( msg ) => {
				this.createNotice(
					{ status: 'error', content: msg },
					setNoticeList
				);
			},

			/**
			 * Removes a notice by id.
			 *
			 * @param {string} id  Id of the notice to remove.
			 */
			removeNotice: ( id ) => {
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
} );
