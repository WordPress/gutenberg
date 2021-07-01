/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	requestBlockTypeImpressions,
	setBlockTypeImpressionCount,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

function useBlockTypeImpressions( blockTypes ) {
	const [ blockTypeImpressions, setBlockTypeImpressions ] = useState( {} );
	const { enableEditorOnboarding } = useSelect( ( select ) => {
		const { getSettings: getBlockEditorSettings } = select(
			blockEditorStore
		);

		return {
			enableEditorOnboarding: getBlockEditorSettings().editorOnboarding,
		};
	}, [] );

	// Request current block impressions from native app
	useEffect( () => {
		let isCurrent = true;

		requestBlockTypeImpressions( ( impressions ) => {
			if ( isCurrent ) {
				setBlockTypeImpressions( impressions );
			}
		} );

		return () => {
			isCurrent = false;
		};
	}, [] );

	const items = enableEditorOnboarding
		? blockTypes.map( ( b ) => ( {
				...b,
				isNew: blockTypeImpressions[ b.name ] > 0,
		  } ) )
		: blockTypes;

	const trackBlockTypeSelected = ( name ) => {
		if ( blockTypeImpressions[ name ] > 0 ) {
			setBlockTypeImpressions( ( impressions ) => ( {
				...impressions,
				[ name ]: 0,
			} ) );
			// Persist block type impression count to native app
			setBlockTypeImpressionCount( name, 0 );
		}
	};

	return { items, trackBlockTypeSelected };
}

export default useBlockTypeImpressions;
