/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';

function MetaBoxes( { location, isVisible, metaBoxes } ) {
	return (
		<>
			{ map( metaBoxes, ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			{ isVisible && <MetaBoxesArea location={ location } /> }
		</>
	);
}

export default withSelect( ( select, { location } ) => {
	const { isMetaBoxLocationVisible, getMetaBoxesPerLocation } = select( 'core/edit-post' );

	return {
		metaBoxes: getMetaBoxesPerLocation( location ),
		isVisible: isMetaBoxLocationVisible( location ),
	};
} )( MetaBoxes );
