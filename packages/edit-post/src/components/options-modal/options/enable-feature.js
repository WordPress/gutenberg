/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

export default compose(
	withSelect( ( select, { feature } ) => ( {
		isChecked: select( 'core/edit-post' ).isFeatureActive( feature ),
	} ) ),
	withDispatch( ( dispatch, { feature } ) => {
		const { toggleFeature } = dispatch( 'core/edit-post' );
		return {
			onChange() {
				toggleFeature( feature );
			},
		};
	} )
)( BaseOption );
