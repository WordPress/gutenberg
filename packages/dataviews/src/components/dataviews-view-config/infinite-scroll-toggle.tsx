/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';

export default function InfiniteScrollToggle() {
	const context = useContext( DataViewsContext );
	const { view, onChangeView } = context;
	const infiniteScrollEnabled = view.infiniteScrollEnabled ?? false;

	// Only render the toggle if an infinite scroll handler is available
	if ( ! context.hasInfiniteScrollHandler ) {
		return null;
	}

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Enable infinite scroll' ) }
			help={ __(
				'Automatically load more content as you scroll, instead of showing pagination links.'
			) }
			checked={ infiniteScrollEnabled }
			onChange={ ( newValue ) => {
				onChangeView( {
					...view,
					infiniteScrollEnabled: newValue,
				} );
			} }
		/>
	);
}
