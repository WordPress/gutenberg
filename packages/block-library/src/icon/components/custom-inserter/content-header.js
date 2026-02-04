/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { SearchControl } from '@wordpress/components';

export default function ContentHeader( props ) {
	const { searchInput, setSearchInput, shownIconsCount } = props;

	return (
		<div className="icon-inserter__content-header">
			<div className="icon-inserter__content-header__search">
				<SearchControl
					value={ searchInput }
					onChange={ setSearchInput }
					__nextHasNoMarginBottom
				/>
				<div className="search-results">
					{ searchInput &&
						sprintf(
							// translators: %1$s: Number of icons returned from search, %2$s: the search input
							_n(
								'%1$s search result for "%2$s"',
								'%1$s search results for "%2$s"',
								shownIconsCount
							),
							shownIconsCount,
							searchInput
						) }
				</div>
			</div>
		</div>
	);
}
