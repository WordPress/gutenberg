/**
 * Internal dependencies
 */
import TemplatePartRenameModal from './rename';

export const TEMPLATE_PART_MODALS = {
	rename: 'edit-site/template-part-rename',
	duplicate: 'edit-site/template-part-duplicate',
};

export default function TemplatePartModal() {
	// Duplication command and modal is in separate follow-up.
	return (
		<>
			<TemplatePartRenameModal />
			{ /* <PatternDuplicateModal /> */ }
		</>
	);
}
