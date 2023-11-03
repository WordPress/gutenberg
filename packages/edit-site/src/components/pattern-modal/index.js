/**
 * Internal dependencies
 */
import PatternRenameModal from './rename';
import PatternDuplicateModal from './duplicate';

export const PATTERN_MODALS = {
	rename: 'edit-site/pattern-rename',
	duplicate: 'edit-site/pattern-duplicate',
};

export default function PatternModal( props ) {
	return (
		<>
			<PatternDuplicateModal { ...props } />
			<PatternRenameModal { ...props } />
		</>
	);
}
