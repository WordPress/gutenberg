/**
 * WordPress dependencies
 */
import { createContext, useContext, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

const GlobalStylesContext = createContext( {
	/* eslint-disable no-unused-vars */
	getProperty: ( context, family, name, units ) => {},
	setProperty: ( context, family, name, value, units ) => {},
	globalContext: {},
	/* eslint-enable no-unused-vars */
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( { children, entityId, globalContext } ) => {
	const {
		userStyles,
		getProperty,
		setProperty,
	} = useGlobalStylesFromEntities( entityId );

	useGlobalStylesEffectToUpdateStylesheet( userStyles );

	return (
		<GlobalStylesContext.Provider
			value={ {
				getProperty,
				setProperty,
				globalContext,
			} }
		>
			{ children }
		</GlobalStylesContext.Provider>
	);
};

/**
 * Hook that exposes an API to retrieve and update user styles.
 *
 * @param {number} entityId Entity that stores the user data as CPT.
 *
 * @return {Object} User data as well as getters and setters.
 */
const useGlobalStylesFromEntities = ( entityId ) => {
	const { editEntityRecord } = useDispatch( 'core' );
	const userStyles = useSelect( ( select ) => {
		// Trigger entity retrieval
		select( 'core' ).getEntityRecord(
			'postType',
			'wp_global_styles',
			entityId
		);

		const userData = select( 'core' ).getEditedEntityRecord(
			'postType',
			'wp_global_styles',
			entityId
		);

		return userData?.content ? JSON.parse( userData.content ) : {};
	} );

	const fromUnits = {
		noop: ( value ) => value,
		px: ( value ) => ( value ? +value.replace( 'px', '' ) : null ),
	};
	const toUnits = {
		noop: ( value ) => value,
		px: ( value ) => ( value ? value + 'px' : null ),
	};

	const getProperty = ( context, family, name, units = 'noop' ) =>
		fromUnits[ units ](
			userStyles?.[ context ]?.styles?.[ family ]?.[ name ]
		);

	const setProperty = ( context, family, name, value, units = 'noop' ) =>
		editEntityRecord( 'postType', 'wp_global_styles', entityId, {
			content: JSON.stringify( {
				...userStyles,
				[ context ]: {
					styles: {
						...userStyles?.[ context ]?.styles,
						[ family ]: {
							...userStyles?.[ context ]?.styles?.[ family ],
							[ name ]: toUnits[ units ]( value ),
						},
					},
				},
			} ),
		} );

	return {
		userStyles,
		getProperty,
		setProperty,
	};
};

const useGlobalStylesEffectToUpdateStylesheet = ( userStyles ) => {
	useEffect( () => {
		const embeddedStylesheetId = 'user-generated-global-styles-inline-css';
		let styleNode = document.getElementById( embeddedStylesheetId );

		if ( ! styleNode ) {
			styleNode = document.createElement( 'style' );
			styleNode.id = embeddedStylesheetId;
			document
				.getElementsByTagName( 'head' )[ 0 ]
				.appendChild( styleNode );
		}

		styleNode.innerText = getStylesFromTree( userStyles );
	}, [ userStyles ] );
};

const getStylesFromTree = ( tree ) => {
	const styles = [];

	const getSelector = ( blockName ) => {
		if ( 'global' === blockName ) {
			return ''; // We use the .editor-styles-wrapper for this one
		}

		const {
			name,
			supports: { __experimentalSelector },
		} = getBlockType( blockName );

		let selector = '.wp-block-' + name.replace( 'core/', '' );
		if (
			__experimentalSelector &&
			'string' === typeof __experimentalSelector
		) {
			selector = __experimentalSelector;
		}
		return selector;
	};

	const getStyleDeclarations = ( blockStyles ) => {
		const declarations = [];
		if ( blockStyles?.typography?.fontSize ) {
			declarations.push(
				`font-size: ${ blockStyles.typography.fontSize }`
			);
		}
		if ( blockStyles?.typography?.lineHeight ) {
			declarations.push(
				`line-height: ${ blockStyles.typography.lineHeight }`
			);
		}
		if ( blockStyles?.color?.text ) {
			declarations.push( `color: ${ blockStyles.color.text }` );
		}
		if ( blockStyles?.color?.background ) {
			declarations.push(
				`background-color: ${ blockStyles.color.background }`
			);
		}
		if ( blockStyles?.color?.link ) {
			declarations.push(
				`--wp--style--color--link: ${ blockStyles.color.link }`
			);
		}
		return declarations.join( ';' );
	};

	Object.keys( tree ).forEach( ( blockName ) => {
		const blockSelector = getSelector( blockName );
		const blockDeclarations = getStyleDeclarations(
			tree[ blockName ]?.styles
		);

		// TODO: look at how to hook into the styles generation
		// so we can avoid having to increase the class specificity here.
		styles.push(
			`.editor-styles-wrapper.editor-styles-wrapper ${ blockSelector } { ${ blockDeclarations } }`
		);
	} );

	return styles.join( '' );
};
