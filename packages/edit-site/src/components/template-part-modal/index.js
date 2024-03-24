/**
 * Internal dependencies
 */
import TemplatePartDuplicateModal from './duplicate';
import TemplatePartRenameModal from './rename';

export const TEMPLATE_PART_MODALS = {
	rename: 'edit-site/template-part-rename',
	duplicate: 'edit-site/template-part-duplicate',
};

export default function TemplatePartModal() {
	return (
		<>
			<TemplatePartRenameModal />
			<TemplatePartDuplicateModal />
		</>
	);
}
