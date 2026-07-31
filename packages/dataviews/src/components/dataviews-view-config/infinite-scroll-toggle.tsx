/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
import i18n from '@wordpress/dataviews-i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';

export default function InfiniteScrollToggle() {
	const context = useContext( DataViewsContext );
	const { view, onChangeView } = context;
	const infiniteScrollEnabled = view.infiniteScrollEnabled ?? false;

	return (
		<ToggleControl
			label={ i18n.ENABLE_INFINITE_SCROLL() }
			help={ i18n.ENABLE_INFINITE_SCROLL_HELP() }
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
