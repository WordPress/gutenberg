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
	withSelect( ( select ) => ( {
		isChecked: select( 'core/edit-post' ).isFeatureActive(
			'showIconLabels'
		),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onChange: () =>
			dispatch( 'core/edit-post' ).toggleFeature( 'showIconLabels' ),
	} ) )
)( BaseOption );
