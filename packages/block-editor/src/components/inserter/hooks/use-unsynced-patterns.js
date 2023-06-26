/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useBlockTypesState from '../hooks/use-block-types-state';

export default function useUnsyncedPatterns(
	rootClientId,
	onInsert,
	withBlocks
) {
	const [ unsyncedPatterns ] = useBlockTypesState(
		rootClientId,
		onInsert,
		'unsynced'
	);
	const filteredUnsyncedPatterns = useMemo( () => {
		return unsyncedPatterns
			.filter(
				( { category: unsyncedPatternCategory } ) =>
					unsyncedPatternCategory === 'reusable'
			)
			.map( ( syncedPattern ) => ( {
				...syncedPattern,
				blocks: withBlocks
					? parse( syncedPattern.content, {
							__unstableSkipMigrationLogs: true,
					  } )
					: undefined,
			} ) );
	}, [ unsyncedPatterns, withBlocks ] );
	return filteredUnsyncedPatterns;
}
