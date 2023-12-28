/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

export function EditorNotices( { notices, onRemove } ) {
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
				onRemove={ onRemove }
			>
				<TemplateValidationNotice />
			</NoticeList>
		</>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		notices: select( noticesStore ).getNotices(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onRemove: dispatch( noticesStore ).removeNotice,
	} ) ),
] )( EditorNotices );
