/**
 * Internal dependencies
 */
import EditTemplateNotification from './edit-template-notification';
import BackToPageNotification from './back-to-page-notification';

export default function PageContentFocusNotifications( { contentRef } ) {
	return (
		<>
			<EditTemplateNotification contentRef={ contentRef } />
			<BackToPageNotification />
		</>
	);
}
