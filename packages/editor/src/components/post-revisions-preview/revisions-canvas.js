/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import VisualEditor from '../visual-editor';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

/**
 * Canvas component that renders a post revision in read-only mode.
 *
 * @param {Object} props          Component props.
 * @param {Object} props.revision The revision object to display.
 * @return {JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas( { revision } ) {
	// Parse the revision content into blocks.
	const blocks = useMemo( () => {
		const content = revision?.content?.raw || revision?.content?.rendered;
		if ( ! content ) {
			return [];
		}
		const parsed = parse( content );
		// Ensure blocks is always an array.
		return Array.isArray( parsed ) ? parsed : [ parsed ];
	}, [ revision?.content?.raw, revision?.content?.rendered ] );

	// Get current editor settings to use for the preview.
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	// Modify settings to enable preview mode.
	const settings = useMemo(
		() => ( {
			...originalSettings,
			isPreviewMode: true,
		} ),
		[ originalSettings ]
	);

	if ( ! revision ) {
		return (
			<div className="editor-revisions-canvas__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<>
			<ExperimentalBlockEditorProvider
				value={ blocks }
				settings={ settings }
			>
				<VisualEditor />
			</ExperimentalBlockEditorProvider>
		</>
	);
}
