/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import compareWidths from './compare-widths';

const useContainerMatch = ( queries ) => {
	const [ currentContainerWidth, setContainerWidth ] = useState( null );
	const [ containerMatches, setContainerMatches ] = useState( null );

	const matchWidth = ( containerWidth ) => mapValues( queries, ( query ) => {
		const [ queryWidth, operator = '>=' ] = query.split( ' ' ).reverse();
		return compareWidths( operator, queryWidth, containerWidth );
	} );

	const onLayout = useCallback( ( { nativeEvent } ) => {
		const { width } = nativeEvent.layout;

		if ( width !== currentContainerWidth ) {
			setContainerWidth( width );
			matchWidth( width );
			setContainerMatches( matchWidth( width ) );
		}
	}, [] );

	return [ containerMatches, onLayout ];
};

export default useContainerMatch;

