/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Migrates footnotes from post meta to block attributes when the block loads.
 *
 * On first render, if the block has no footnotes in attributes but meta
 * contains footnotes, it copies them to attributes (one-time migration).
 * Returns the current footnotes array from whichever source has data,
 * so the UI always renders correctly even before migration completes.
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Function to update block attributes.
 * @param {Object}   meta          Post meta object.
 * @return {Array} The current footnotes array.
 */
export function useMigrateFootnotes( attributes, setAttributes, meta ) {
	const migrationAttemptedRef = useRef( false );
	const footnotesSupported = 'string' === typeof meta?.footnotes;

	// Parse meta.footnotes once per value change.
	const footnotesFromMeta = useMemo( () => {
		if ( footnotesSupported && meta?.footnotes ) {
			try {
				return JSON.parse( meta.footnotes );
			} catch ( e ) {
				return null;
			}
		}
		return null;
	}, [ meta?.footnotes, footnotesSupported ] );

	// Return footnotes from attributes if available, otherwise from meta.
	const footnotes = useMemo( () => {
		if (
			attributes?.footnotes &&
			Array.isArray( attributes.footnotes ) &&
			attributes.footnotes.length > 0
		) {
			return attributes.footnotes;
		}
		return Array.isArray( footnotesFromMeta ) ? footnotesFromMeta : [];
	}, [ attributes?.footnotes, footnotesFromMeta ] );

	// One-time migration: copy meta footnotes to block attributes.
	useEffect( () => {
		if ( ! footnotesSupported || migrationAttemptedRef.current ) {
			return;
		}

		// Already has data in attributes — no migration needed.
		if (
			attributes?.footnotes &&
			Array.isArray( attributes.footnotes ) &&
			attributes.footnotes.length > 0
		) {
			return;
		}

		// Has data in meta — migrate it.
		if (
			footnotesFromMeta &&
			Array.isArray( footnotesFromMeta ) &&
			footnotesFromMeta.length > 0
		) {
			migrationAttemptedRef.current = true;
			setAttributes( { footnotes: [ ...footnotesFromMeta ] } );
		}
	}, [ attributes, setAttributes, footnotesFromMeta, footnotesSupported ] );

	return footnotes;
}
