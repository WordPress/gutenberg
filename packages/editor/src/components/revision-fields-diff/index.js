/*
 * `diffWordsWithSpace` preserves the v4-style per-word output. v6+
 * stopped treating whitespace as a token in `diffWords`, which coalesces
 * adjacent word changes into a single removed/added pair.
 */
import { diffWordsWithSpace } from 'diff';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import RevisionDiffPanel from '../revision-diff-panel';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Safely stringifies a value for display and comparison.
 *
 * @param {*} value The value to stringify.
 * @return {string} The stringified value.
 */
function stringifyValue( value ) {
	if ( value === null || value === undefined ) {
		return '';
	}
	if ( typeof value === 'object' ) {
		return JSON.stringify( value, null, 2 );
	}
	return String( value );
}

/**
 * Determines whether a meta value should be treated as empty.
 *
 * @param {string} str The stringified value.
 * @return {boolean} Whether the value is effectively empty.
 */
function isEmptyMeta( str ) {
	return ! str || str === '[]' || str === '{}';
}

/**
 * Builds the field diffs shown in the sidebar.
 *
 * Title and excerpt only appear when they changed. Meta fields keep their
 * existing behavior and appear when either revision has a non-empty value.
 *
 * @param {Object}      revision         The current revision record.
 * @param {Object|null} previousRevision The previous revision record.
 * @return {Object} Field diff entries and whether the title or excerpt changed.
 */
export function getFieldsDiffEntries( revision, previousRevision ) {
	if ( ! revision ) {
		return { entries: null, hasChangedPostFields: false };
	}

	const entries = {};
	let hasChangedPostFields = false;

	for ( const [ label, field ] of [
		[ __( 'Title' ), 'title' ],
		[ __( 'Excerpt' ), 'excerpt' ],
	] ) {
		const revStr = revision[ field ]?.raw ?? '';
		const prevStr = previousRevision?.[ field ]?.raw ?? '';

		if ( revStr !== prevStr ) {
			entries[ label ] = diffWordsWithSpace( prevStr, revStr );
			hasChangedPostFields = true;
		}
	}

	const revisionMeta = revision.meta ?? {};
	const previousMeta = previousRevision?.meta ?? {};
	const allMetaKeys = new Set( [
		...Object.keys( revisionMeta ),
		...Object.keys( previousMeta ),
	] );

	for ( const key of allMetaKeys ) {
		const revStr = stringifyValue( revisionMeta[ key ] );
		const prevStr = stringifyValue( previousMeta[ key ] );

		if ( isEmptyMeta( revStr ) && isEmptyMeta( prevStr ) ) {
			continue;
		}

		entries[ key ] = diffWordsWithSpace( prevStr, revStr );
	}

	if ( Object.keys( entries ).length === 0 ) {
		return { entries: null, hasChangedPostFields: false };
	}

	return { entries, hasChangedPostFields };
}

/**
 * Shows title, excerpt, and meta field changes in the revisions sidebar.
 */
export default function RevisionFieldsDiffPanel() {
	const { revision, previousRevision, revisionId } = useSelect(
		( select ) => {
			const {
				getCurrentRevision,
				getPreviousRevision,
				getCurrentRevisionId,
			} = unlock( select( editorStore ) );

			return {
				revision: getCurrentRevision(),
				previousRevision: getPreviousRevision(),
				revisionId: getCurrentRevisionId(),
			};
		},
		[]
	);

	const { entries, hasChangedPostFields } = useMemo(
		() => getFieldsDiffEntries( revision, previousRevision ),
		[ revision, previousRevision ]
	);

	const [ isOpen, setIsOpen ] = useState( hasChangedPostFields );

	/*
	 * `PanelBody` only reads `initialOpen` when it mounts, but this panel stays
	 * mounted while the selected revision changes. Open it for title or excerpt
	 * changes. Once open, leave it open until the user closes it.
	 */
	useEffect( () => {
		if ( hasChangedPostFields ) {
			setIsOpen( true );
		}
	}, [ revisionId, hasChangedPostFields ] );

	return (
		<RevisionDiffPanel
			title={ __( 'Fields' ) }
			entries={ entries }
			opened={ isOpen }
			onToggle={ setIsOpen }
			className="editor-revision-meta-diff__content"
		/>
	);
}
