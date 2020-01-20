/**
 * Internal dependencies
 */
import {
	getGlobalStylesSheetAsCssString,
	globalStylesManager,
	useRootStyleSystem,
} from '../style-system';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

window.gsm = globalStylesManager;

function GlobalStylesEdit( { className, setAttributes } ) {
	const [ cssString, setCssString ] = useState( '' );
	const [ rootSystemState ] = useRootStyleSystem();
	const rootClassName = rootSystemState.className;

	const cssStringRef = useRef( '' );

	useEffect( () => {
		if ( rootClassName ) {
			const rootStyles =
				globalStylesManager.cache.registered[ rootClassName ];
			if ( rootStyles ) {
				const rootCssString = `:root { ${ rootStyles } }`;
				setAttributes( { rootCssString } );
			}
		}
	}, [ rootClassName ] );

	useEffect( () => {
		getGlobalStylesSheetAsCssString().then( setCssString );
	}, [ setCssString ] );

	useEffect( () => {
		if ( cssString && cssString !== cssStringRef.current ) {
			setAttributes( { cssString } );
			cssStringRef.current = cssString;
		}
	}, [ cssString, cssStringRef, setAttributes ] );

	return (
		<div className={ className } style={ { opacity: 0.3 } }>
			Experimental: This block renders global styles on the front-end
		</div>
	);
}

export default GlobalStylesEdit;
