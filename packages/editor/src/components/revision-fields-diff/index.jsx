/*
 * `diffWordsWithSpace` preserves the v4-style per-word output. v6+
 * stopped treating whitespace as a token in `diffWords`, which coalesces
 * adjacent word changes into a single removed/added pair.
 */
import { diffWordsWithSpace } from 'diff';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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
 * Determines whether a value should be treated as empty.
 *
 * @param {string} str The stringified value.
 * @return {boolean} Whether the value is effectively empty.
 */
function isEmptyValue( str ) {
	return ! str || str === '[]' || str === '{}';
}

/**
 * Panel that shows the fields that changed between the current revision and
 * the previous revision in the document sidebar during revision mode.
 *
 * Fields a plugin registered with `_wp_post_revision_fields` come with a name
 * to show, and cover the same ground as the classic revisions screen. The
 * post meta the REST API exposes is shown under its key.
 */
export default function RevisionFieldsDiffPanel() {
	const { revision, previousRevision } = useSelect( ( select ) => {
		const { getCurrentRevision, getPreviousRevision } = unlock(
			select( editorStore )
		);

		return {
			revision: getCurrentRevision(),
			previousRevision: getPreviousRevision(),
		};
	}, [] );

	const { entries, labels } = useMemo( () => {
		const nothing = { entries: null, labels: null };

		if ( ! revision ) {
			return nothing;
		}

		const revisionFields = revision.revision_fields ?? {};
		const previousFields = previousRevision?.revision_fields ?? {};
		const revisionMeta = revision.meta ?? {};
		const previousMeta = previousRevision?.meta ?? {};

		const fieldKeys = new Set( [
			...Object.keys( revisionFields ),
			...Object.keys( previousFields ),
		] );
		const metaKeys = new Set(
			[
				...Object.keys( revisionMeta ),
				...Object.keys( previousMeta ),
			].filter( ( key ) => ! fieldKeys.has( key ) )
		);

		const result = {};
		const names = {};

		const add = ( key, from, to, label ) => {
			const fromStr = stringifyValue( from );
			const toStr = stringifyValue( to );

			if ( isEmptyValue( fromStr ) && isEmptyValue( toStr ) ) {
				return;
			}

			result[ key ] = diffWordsWithSpace( fromStr, toStr );
			names[ key ] = label;
		};

		for ( const key of fieldKeys ) {
			add(
				key,
				previousFields[ key ]?.value,
				revisionFields[ key ]?.value,
				revisionFields[ key ]?.label ??
					previousFields[ key ]?.label ??
					key
			);
		}

		for ( const key of metaKeys ) {
			add( key, previousMeta[ key ], revisionMeta[ key ], key );
		}

		if ( Object.keys( result ).length === 0 ) {
			return nothing;
		}

		return { entries: result, labels: names };
	}, [ revision, previousRevision ] );

	return (
		<RevisionDiffPanel
			title={ __( 'Fields' ) }
			entries={ entries }
			labels={ labels }
			initialOpen={ false }
			className="editor-revision-meta-diff__content"
		/>
	);
}
