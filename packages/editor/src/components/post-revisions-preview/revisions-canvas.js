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
import { useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import VisualEditor from '../visual-editor';
import { preserveClientIds } from './preserve-client-ids';

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

	// Track previously rendered blocks to preserve clientIds between renders.
	const previousBlocksRef = useRef( [] );

	const blocks = useMemo( () => {
		let parsedBlocks = parse( revision?.content?.raw ?? '' );
		if ( postType === 'wp_navigation' ) {
			parsedBlocks = [
				createBlock(
					'core/navigation',
					{ templateLock: false },
					parsedBlocks
				),
			];
		}

		// Preserve clientIds from previous render to prevent React unmount/remount.
		const blocksWithStableIds = preserveClientIds(
			parsedBlocks,
			previousBlocksRef.current
		);

		// Update ref for next render.
		previousBlocksRef.current = blocksWithStableIds;

		return blocksWithStableIds;
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
