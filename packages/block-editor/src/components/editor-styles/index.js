/**
 * External dependencies
 */
import { compact, map } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

function syncDarkThemeBodyClassname( node ) {
	const backgroundColor = window
		.getComputedStyle( node, null )
		.getPropertyValue( 'background-color' );

	const { ownerDocument } = node;
	const body = ownerDocument.getElementsByTagName( 'body' )[ 0 ];

	if ( tinycolor( backgroundColor ).getLuminance() > 0.5 ) {
		body.classList.remove( 'is-dark-theme' );
	} else {
		body.classList.add( 'is-dark-theme' );
	}
}

export default function useEditorStyles( styles ) {
	const nodes = useRef( [] );

	return useCallback(
		( node ) => {
			if ( ! node ) {
				nodes.current.forEach( ( styleElement ) =>
					styleElement.ownerDocument.body.removeChild( styleElement )
				);
				return;
			}

			const updatedStyles = transformStyles(
				styles,
				'.editor-styles-wrapper'
			);

			const { ownerDocument } = node;
			nodes.current = map( compact( updatedStyles ), ( updatedCSS ) => {
				const styleElement = ownerDocument.createElement( 'style' );
				styleElement.innerHTML = updatedCSS;
				ownerDocument.body.appendChild( styleElement );

				return styleElement;
			} );

			syncDarkThemeBodyClassname( node );
		},
		[ styles ]
	);
}
