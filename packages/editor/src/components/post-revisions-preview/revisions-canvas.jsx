import { Spinner as WCSpinner } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import VisualEditor from '../visual-editor';
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
} from './diff-format-types';
import { useDiffMarkers } from './diff-markers';
// The diff CSS, the removed-block SVG filter, the accessible descriptions,
// and the BlockListBlock filter that stamps diff classes live in
// block-diff-view.tsx, shared with hosts outside the revisions screen.
import {
	DiffDescriptions,
	REVISION_DIFF_STYLES,
	REVISION_REMOVED_FILTER_SVG,
} from './block-diff-view';

const { usePrivateStyleOverride } = unlock( blockEditorPrivateApis );

/**
 * Component to inject diff styles via style overrides.
 * Must be rendered inside ExperimentalBlockEditorProvider.
 *
 * @param {Object}  props          Component props.
 * @param {boolean} props.showDiff Whether to show diff highlighting.
 */
function DiffStyleOverrides( { showDiff } ) {
	usePrivateStyleOverride( {
		css: showDiff ? REVISION_DIFF_STYLES : '',
	} );
	usePrivateStyleOverride( {
		assets: showDiff ? REVISION_REMOVED_FILTER_SVG : '',
		__unstableType: 'svgs',
	} );
	return null;
}

function CanvasContent( { showDiff } ) {
	const [ contentRef, diffMarkers ] = useDiffMarkers();
	return (
		<>
			{ showDiff && <DiffDescriptions /> }
			<VisualEditor contentRef={ contentRef } />
			{ showDiff && diffMarkers }
		</>
	);
}

/**
 * Canvas component that renders a post revision in read-only mode.
 * Block preparation and settings are handled by the parent EditorProvider.
 *
 * @return {React.JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas() {
	useEffect( () => {
		registerDiffFormatTypes();
		return () => {
			unregisterDiffFormatTypes();
		};
	}, [] );

	const { revision, showDiff } = useSelect( ( select ) => {
		const { getShownVersion, isShowingRevisionDiff } = unlock(
			select( editorStore )
		);
		return {
			revision: getShownVersion(),
			showDiff: isShowingRevisionDiff(),
		};
	}, [] );

	return revision ? (
		<>
			<DiffStyleOverrides showDiff={ showDiff } />
			<div className="editor-revisions-canvas__content">
				<CanvasContent showDiff={ showDiff } />
			</div>
		</>
	) : (
		<div className="editor-revisions-canvas__loading">
			<WCSpinner />
		</div>
	);
}
