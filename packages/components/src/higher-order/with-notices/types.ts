/**
 * Internal dependencies
 */
import type { NoticeListProps } from '../../notice/types';

export type WithNoticeProps = {
	noticeList: NoticeListProps[ 'notices' ];
	noticeOperations: {
		/**
		 * Function passed down as a prop that adds a new notice.
		 *
		 * @param notice Notice to add.
		 */
		createNotice: (
			notice: NoticeListProps[ 'notices' ][ number ]
		) => void;
		/**
		 * Function passed as a prop that adds a new error notice.
		 *
		 * @param msg Error message of the notice.
		 */
		createErrorNotice: ( msg: string ) => void;
		/**
		 * Removes a notice by id.
		 *
		 * @param id Id of the notice to remove.
		 */
		removeNotice: ( id: string ) => void;
		/**
		 * Removes all notices
		 */
		removeAllNotices: () => void;
	};
	noticeUI: false | JSX.Element;
};
