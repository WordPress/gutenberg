/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import VisualEditor from '../visual-editor';
import RevisionsSidebar from '../sidebar/revisions-sidebar';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

/**
 * Canvas component that renders a post revision in read-only mode.
 *
 * @param {Object} props          Component props.
 * @param {Object} props.revision The revision object to display.
 * @return {JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas( { revision } ) {
	// Get block editor settings.
	const blockEditorSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	// Parse revision content into blocks.
	const blocks = useMemo( () => {
		const currentContent = revision?.content?.raw || '';
		return parse( currentContent );
	}, [ revision?.content?.raw ] );

	// Modify settings to enable preview mode.
	const settings = useMemo(
		() => ( {
			...blockEditorSettings,
			isPreviewMode: true,
		} ),
		[ blockEditorSettings ]
	);

	return (
		<>
			{ revision ? (
				<ExperimentalBlockEditorProvider
					value={ blocks }
					settings={ settings }
				>
					<VisualEditor />
				</ExperimentalBlockEditorProvider>
			) : (
				<div className="editor-revisions-canvas__loading">
					<Spinner />
				</div>
			) }
			<RevisionsSidebar
				revisionId={ revision?.id }
				revisionDate={ revision?.date }
				revisionContent={ revision?.content?.raw }
			/>
		</>
	);
}
