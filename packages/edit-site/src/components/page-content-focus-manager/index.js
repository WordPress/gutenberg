/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import DisableNonPageContentBlocks from './disable-non-page-content-blocks';
import EditTemplateNotification from './edit-template-notification';
import BackToPageNotification from './back-to-page-notification';

export default function PageContentFocusManager( { contentRef } ) {
	const hasPageContentFocus = useSelect(
		( select ) => select( editSiteStore ).hasPageContentFocus(),
		[]
	);
	return (
		<>
			{ hasPageContentFocus && <DisableNonPageContentBlocks /> }
			<EditTemplateNotification contentRef={ contentRef } />
			<BackToPageNotification />
		</>
	);
}
