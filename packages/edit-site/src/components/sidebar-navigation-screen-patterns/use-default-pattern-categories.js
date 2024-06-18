/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

export default function useDefaultPatternCategories() {
	const blockPatternCategories = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const settings = getSettings();

		return (
			settings.__experimentalAdditionalBlockPatternCategories ??
			settings.__experimentalBlockPatternCategories
		);
	} );

	const restBlockPatternCategories = useSelect( ( select ) =>
		select( coreStore ).getBlockPatternCategories()
	);

	return [
		...( blockPatternCategories || [] ),
		...( restBlockPatternCategories || [] ),
	];
}
