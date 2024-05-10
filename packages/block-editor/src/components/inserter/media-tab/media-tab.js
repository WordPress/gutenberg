/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from './media-panel';
import { useMediaCategories } from './hooks';
import MobileTabNavigation from '../mobile-tab-navigation';
import InserterNoResults from '../no-results';

function MediaTab( { rootClientId, onInsert } ) {
	const mediaCategories = useMediaCategories( rootClientId );
	const categories = useMemo(
		() =>
			mediaCategories.map( ( mediaCategory ) => ( {
				...mediaCategory,
				label: mediaCategory.labels.name,
			} ) ),
		[ mediaCategories ]
	);

	if ( ! categories.length ) {
		return <InserterNoResults />;
	}

	return (
		<MobileTabNavigation categories={ categories }>
			{ ( category ) => (
				<MediaCategoryPanel
					onInsert={ onInsert }
					rootClientId={ rootClientId }
					category={ category }
				/>
			) }
		</MobileTabNavigation>
	);
}

export default MediaTab;
