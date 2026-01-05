/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Migrates footnotes from post meta to block attributes when the block loads.
 * This follows the same pattern as quote and list blocks for handling migrations.
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Function to update block attributes.
 * @param {Object}   meta          Post meta object.
 */
export function useMigrateFootnotes( attributes, setAttributes, meta ) {
	const migrationAttemptedRef = useRef( false );
	const footnotesSupported = 'string' === typeof meta?.footnotes;

	// Parse meta.footnotes once
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

	// Always return footnotes - from attributes if migrated, from parsed meta if not yet migrated
	const footnotes = useMemo( () => {
		const hasBlockAttributes =
			attributes?.footnotes &&
			Array.isArray( attributes.footnotes ) &&
			attributes.footnotes.length > 0;

		if ( hasBlockAttributes ) {
			return attributes.footnotes;
		}

		// Fallback to parsed meta if not migrated yet
		return Array.isArray( footnotesFromMeta ) ? footnotesFromMeta : [];
	}, [ attributes?.footnotes, footnotesFromMeta ] );

	useEffect( () => {
		// Only migrate if:
		// 1. Footnotes are supported
		// 2. Migration hasn't been attempted yet
		if ( ! footnotesSupported || migrationAttemptedRef.current ) {
			return;
		}

		const hasBlockAttributes =
			attributes?.footnotes &&
			Array.isArray( attributes.footnotes ) &&
			attributes.footnotes.length > 0;

		if ( hasBlockAttributes ) {
			return;
		}

		// Use the already-parsed footnotesFromMeta
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
