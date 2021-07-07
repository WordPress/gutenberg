/**
 * WordPress dependencies
 */
import { __experimentalBlockPatternSetup as BlockPatternSetup } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

export default function PatternsSetup( { area, clientId, onCreate } ) {
	const blockNameWithArea = area
		? `core/template-part/${ area }`
		: 'core/template-part';

	return (
		<BlockPatternSetup
			clientId={ clientId }
			startBlankComponent={
				<StartBlankComponent onCreate={ onCreate } />
			}
			onBlockPatternSelect={ onCreate }
			filterPatternsFn={ ( pattern ) =>
				pattern?.blockTypes?.some?.(
					( blockType ) => blockType === blockNameWithArea
				)
			}
		/>
	);
}

function StartBlankComponent( { onCreate } ) {
	useEffect( () => {
		onCreate();
	}, [] );
	return null;
}
