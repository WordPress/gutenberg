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
	withSelect( ( select, { featureName } ) => {
		const { isFeatureActive } = select( 'core/edit-post' );
		return {
			isChecked: isFeatureActive( featureName ),
		};
	} ),
	withDispatch( ( dispatch, { featureName } ) => ( {
		onChange: () =>
			dispatch( 'core/edit-post' ).toggleFeature( featureName ),
	} ) )
)( BaseOption );
