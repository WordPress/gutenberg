/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState } from '@wordpress/element';
/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import compareWidths from './compare-widths';

const withContainerMatch = ( queries ) => createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const [ currentContainerWidth, setContainerWidth ] = useState( null );
		const [ containerMatches, setContainerMatches ] = useState( null );

		const matchWidth = ( containerWidth ) => mapValues( queries, ( query ) => {
			const [ queryWidth, operator = '>=' ] = query.split( ' ' ).reverse();
			return compareWidths( operator, queryWidth, containerWidth );
		} );

		const onLayout = ( { nativeEvent } ) => {
			const { width } = nativeEvent.layout;

			if ( width !== currentContainerWidth ) {
				setContainerWidth( width );
				matchWidth( width );
				setContainerMatches( matchWidth( width ) );
			}
		};

		return (
			<WrappedComponent
				{ ...props }
				onLayout={ onLayout }
				{ ...containerMatches }
			/>
		);
	},
	'withContainerMatch'
);

export default withContainerMatch;
