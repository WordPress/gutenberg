/**
 * Internal dependencies
 */
import save from './save';
import saveV1 from './v1/save';

/*
 * Using a wrapper around the logic to load the save for v1 of Gallery block
 * or the refactored version with InnerBlocks. This is to prevent conditional
 * use of hooks lint errors if adding this logic to the top of the save component.
 */
export default function saveWrapper( { attributes } ) {
	if ( attributes?.ids?.length > 0 || attributes?.images?.length > 0 ) {
		return saveV1( { attributes } );
	}

	return save( { attributes } );
}
