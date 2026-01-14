/**
 * WordPress dependencies
 */
import { LibraryPanel } from '@wordpress/content-guidelines';

/**
 * Library section - voice, tone, copy rules, vocabulary, etc.
 *
 * @param {Object}   props                    Component props.
 * @param {string}   props.initialSubsection  Initial subsection ID from URL.
 * @param {Function} props.onSubsectionChange Callback when subsection changes.
 * @return {JSX.Element} Library panel.
 */
export default function GuidelinesLibrary( {
	initialSubsection,
	onSubsectionChange,
} ) {
	return (
		<LibraryPanel
			initialSection={ initialSubsection }
			onSectionChange={ onSubsectionChange }
		/>
	);
}
