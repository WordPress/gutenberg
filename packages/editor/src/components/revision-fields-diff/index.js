/**
 * External dependencies
 */
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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
 * Panel that shows meta field diffs between the current revision and
 * the previous revision in the document sidebar during revision mode.
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

	const entries = useMemo( () => {
		if ( ! revision ) {
			return null;
		}

		const revisionMeta = revision.meta ?? {};
		const previousMeta = previousRevision?.meta ?? {};
		const allMetaKeys = new Set( [
			...Object.keys( revisionMeta ),
			...Object.keys( previousMeta ),
		] );

		const result = {};

		for ( const key of allMetaKeys ) {
			const revStr = stringifyValue( revisionMeta[ key ] );
			const prevStr = stringifyValue( previousMeta[ key ] );

			if ( ! revStr && ! prevStr ) {
				continue;
			}

			result[ key ] = diffWords( prevStr, revStr );
		}

		if ( Object.keys( result ).length === 0 ) {
			return null;
		}

		return result;
	}, [ revision, previousRevision ] );

	return (
		<RevisionDiffPanel
			title={ __( 'Meta' ) }
			entries={ entries }
			initialOpen={ false }
		/>
	);
}
