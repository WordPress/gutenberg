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

	const decrementBlockTypeImpressionCount = ( name ) => {
		setBlockTypeImpressions( ( impressions ) => {
			if ( impressions[ name ] > 0 ) {
				return {
					...impressions,
					[ name ]: impressions[ name ] - 1,
				};
			}

			return blockTypeImpressions;
		} );
		// Persist updated block impression count for the block
		setBlockTypeImpressionCount( name, blockTypeImpressions[ name ] - 1 );
	};

	return { items, decrementBlockTypeImpressionCount };
}

export default useBlockTypeImpressions;
