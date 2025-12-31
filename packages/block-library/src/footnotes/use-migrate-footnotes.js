/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Custom hook to derive footnotes from block attributes or post meta,
 * and migrate footnotes from post meta to block attributes.
 * This ensures backward compatibility during the transition period.
 *
 * @param {Object}   options                    Hook options.
 * @param {Object}   options.attributes         Block attributes object.
 * @param {Function} options.setAttributes      Function to update block attributes.
 * @param {Object}   options.meta               The post meta object.
 * @param {Function} options.updateMeta         Function to update post meta.
 * @param {boolean}  options.footnotesSupported Whether footnotes are supported in this context.
 * @return {Array} The footnotes array.
 */
export function useMigrateFootnotes( {
	attributes,
	setAttributes,
	meta,
	updateMeta,
	footnotesSupported,
} ) {
	// Get footnotes from block attributes or meta
	const hasBlockAttributes =
		attributes?.footnotes &&
		Array.isArray( attributes.footnotes ) &&
		attributes.footnotes.length > 0;
	const hasMetaFootnotes = meta?.footnotes;

	const footnotes = useMemo( () => {
		if ( hasBlockAttributes ) {
			// Create a deep copy to avoid mutating the original array
			return attributes.footnotes.map( ( fn ) => ( { ...fn } ) );
		}
		if ( hasMetaFootnotes ) {
			return JSON.parse( meta.footnotes );
		}
		return [];
	}, [
		hasBlockAttributes,
		hasMetaFootnotes,
		attributes?.footnotes,
		meta?.footnotes,
	] );

	// Track if migration has been attempted to prevent infinite loops
	const migrationAttempted = useRef( false );

	// Migrate footnotes from meta to block attributes on first access
	useEffect( () => {
		if (
			! hasBlockAttributes &&
			hasMetaFootnotes &&
			footnotes.length > 0 &&
			! migrationAttempted.current
		) {
			// eslint-disable-next-line react-compiler/react-compiler
			migrationAttempted.current = true;
			setAttributes( {
				footnotes,
			} );
			// Also update meta during transition period for backward compatibility
			if ( footnotesSupported ) {
				updateMeta( {
					...meta,
					footnotes: meta.footnotes,
				} );
			}
		}
	}, [
		hasBlockAttributes,
		hasMetaFootnotes,
		footnotes,
		setAttributes,
		footnotesSupported,
		meta,
		updateMeta,
	] );

	return footnotes;
}
