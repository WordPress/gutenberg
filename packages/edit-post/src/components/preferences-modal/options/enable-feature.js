/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { PreferencesModalBaseOption as BaseOption } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default compose(
	withSelect( ( select, { featureName } ) => {
		const { isFeatureActive } = select( editPostStore );
		return {
			isChecked: isFeatureActive( featureName ),
		};
	} ),
	withDispatch( ( dispatch, { featureName } ) => ( {
		onChange: () => dispatch( editPostStore ).toggleFeature( featureName ),
	} ) )
)( BaseOption );
