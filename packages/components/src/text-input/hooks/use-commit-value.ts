/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

export function useCommitValue< T >(
	value: T
): [ T | null, ( nextValue: T | null ) => void, () => void ] {
	const [ commitValue, setCommitValue ] = useState< T | null >( null );
	const resetCommitValue = useCallback( () => setCommitValue( null ), [] );

	useEffect( resetCommitValue, [ value ] );

	return [ commitValue, setCommitValue, resetCommitValue ];
}
