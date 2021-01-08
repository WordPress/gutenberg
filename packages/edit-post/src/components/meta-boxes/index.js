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
import { store as editPostStore } from '../../store';

function MetaBoxes( { location, metaBoxes } ) {
	return (
		<>
			{ map( metaBoxes, ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			<MetaBoxesArea location={ location } />
		</>
	);
}

export default withSelect( ( select, { location } ) => {
	const { getMetaBoxesPerLocation } = select( editPostStore );
	return {
		metaBoxes: getMetaBoxesPerLocation( location ),
	};
} )( MetaBoxes );
