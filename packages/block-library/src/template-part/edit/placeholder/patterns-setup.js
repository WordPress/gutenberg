/**
 * WordPress dependencies
 */
import { __experimentalBlockPatternSetup as BlockPatternSetup } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

export default function PatternsSetup( {
	filterPatternsFn,
	clientId,
	onCreate,
} ) {
	return (
		<BlockPatternSetup
			clientId={ clientId }
			startBlankComponent={
				<StartBlankComponent onCreate={ onCreate } />
			}
			onBlockPatternSelect={ onCreate }
			filterPatternsFn={ filterPatternsFn }
		/>
	);
}

function StartBlankComponent( { onCreate } ) {
	useEffect( () => {
		onCreate();
	}, [] );
	return null;
}
