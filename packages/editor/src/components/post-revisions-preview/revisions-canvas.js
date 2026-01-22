/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import VisualEditor from '../visual-editor';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

/**
 * Canvas component that renders a post revision in read-only mode.
 *
 * @return {JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas() {
	const { revision, postType, blockEditorSettings } = useSelect(
		( select ) => {
			const { getCurrentRevision, getCurrentPostType } = unlock(
				select( editorStore )
			);
			return {
				revision: getCurrentRevision(),
				postType: getCurrentPostType(),
				blockEditorSettings: select( blockEditorStore ).getSettings(),
			};
		},
		[]
	);

	const blocks = useMemo( () => {
		const parsedBlocks = parse( revision?.content?.raw ?? '' );
		if ( postType === 'wp_navigation' ) {
			return [
				createBlock(
					'core/navigation',
					{ templateLock: false },
					parsedBlocks
				),
			];
		}
		return parsedBlocks;
	}, [ revision?.content?.raw, postType ] );

	const settings = useMemo(
		() => ( {
			...blockEditorSettings,
			isPreviewMode: true,
		} ),
		[ blockEditorSettings ]
	);

	return revision ? (
		<ExperimentalBlockEditorProvider value={ blocks } settings={ settings }>
			<VisualEditor />
		</ExperimentalBlockEditorProvider>
	) : (
		<div className="editor-revisions-canvas__loading">
			<Spinner />
		</div>
	);
}
