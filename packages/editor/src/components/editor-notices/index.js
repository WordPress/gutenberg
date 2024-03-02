/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

export function EditorNotices() {
	const { notices } = useSelect(
		( select ) => ( {
			notices: select( noticesStore ).getNotices(),
		} ),
		[]
	);
	const { removeNotice } = useDispatch( noticesStore );
	const dismissibleNotices = notices.filter(
		( { isDismissible, type } ) => isDismissible && type === 'default'
	);
	const nonDismissibleNotices = notices.filter(
		( { isDismissible, type } ) => ! isDismissible && type === 'default'
	);

	return (
		<>
			<NoticeList
				notices={ nonDismissibleNotices }
				className="components-editor-notices__pinned"
			/>
			<NoticeList
				notices={ dismissibleNotices }
				className="components-editor-notices__dismissible"
				onRemove={ removeNotice }
			>
				<TemplateValidationNotice />
			</NoticeList>
		</>
	);
}

export default EditorNotices;
