/**
 * Internal dependencies
 */
import PatternRenameModal from './rename';

export const PATTERN_MODALS = {
	rename: 'edit-site/pattern-rename',
};

export default function PatternModal() {
	// Further modals are likely
	// e.g. duplicating and switching up sync status etc.
	return <PatternRenameModal />;
}
