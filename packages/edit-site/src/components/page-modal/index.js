/**
 * Internal dependencies
 */
import PageRenameModal from './rename';

export const PAGE_MODALS = {
	rename: 'edit-site/page-rename',
};

export default function PageModal() {
	return (
		<>
			{ /* Possibly more Page related commands needing modals to come, hence this wrapper */ }
			<PageRenameModal />
		</>
	);
}
