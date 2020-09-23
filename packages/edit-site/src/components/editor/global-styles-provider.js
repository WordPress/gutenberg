/**
 * External dependencies
 */
import { set, get } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import getGlobalStyles from './global-styles-renderer';

const GlobalStylesContext = createContext( {
	/* eslint-disable no-unused-vars */
	getStyleProperty: ( context, propertyName ) => {},
	setStyleProperty: ( context, propertyName, newValue ) => {},
	globalContext: {},
	/* eslint-enable no-unused-vars */
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( { children, baseStyles, contexts } ) => {
	const [ content, setContent ] = useEntityProp(
		'postType',
		'wp_global_styles',
		'content'
	);

	const userStyles = useMemo(
		() => ( content ? JSON.parse( content ) : {} ),
		[ content ]
	);

	const nextValue = useMemo(
		() => ( {
			contexts,
			getStyleProperty: ( context, propertyName ) =>
				get(
					userStyles?.[ context ]?.styles,
					STYLE_PROPERTY[ propertyName ]
				),
			setStyleProperty: ( context, propertyName, newValue ) => {
				const newContent = { ...userStyles };
				let contextStyles = newContent?.[ context ]?.styles;
				if ( ! contextStyles ) {
					contextStyles = {};
					set( newContent, [ context, 'styles' ], contextStyles );
				}
				set( contextStyles, STYLE_PROPERTY[ propertyName ], newValue );
				setContent( JSON.stringify( newContent ) );
			},
		} ),
		[ contexts, content ]
	);

	useEffect( () => {
		if (
			typeof contexts !== 'object' ||
			typeof baseStyles !== 'object' ||
			typeof userStyles !== 'object'
		) {
			return;
		}

		const embeddedStylesheetId = 'global-styles-inline-css';
		let styleNode = document.getElementById( embeddedStylesheetId );

		if ( ! styleNode ) {
			styleNode = document.createElement( 'style' );
			styleNode.id = embeddedStylesheetId;
			document
				.getElementsByTagName( 'head' )[ 0 ]
				.appendChild( styleNode );
		}

		styleNode.innerText = getGlobalStyles(
			contexts,
			baseStyles,
			userStyles
		);
	}, [ contexts, baseStyles, content ] );

	return (
		<GlobalStylesContext.Provider value={ nextValue }>
			{ children }
		</GlobalStylesContext.Provider>
	);
};
