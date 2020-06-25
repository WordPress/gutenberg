/**
 * WordPress dependencies
 */
import { createContext, useContext, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getGlobalStyles } from './global-styles-renderer';

const GlobalStylesContext = createContext( {
	/* eslint-disable no-unused-vars */
	getProperty: ( context, family, name, units ) => {},
	setProperty: ( context, family, name, value, units ) => {},
	globalContext: {},
	/* eslint-enable no-unused-vars */
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( {
	children,
	entityId,
	globalContext,
	baseStyles,
	blockData,
} ) => {
	const {
		userStyles,
		getProperty,
		setProperty,
	} = useGlobalStylesFromEntities( entityId );

	useGlobalStylesEffectToUpdateStylesheet(
		blockData,
		baseStyles,
		userStyles
	);

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

const useGlobalStylesEffectToUpdateStylesheet = (
	blockData,
	baseStyles,
	userStyles
) => {
	useEffect( () => {
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
			blockData,
			baseStyles,
			userStyles
		);
	}, [ userStyles ] );
};
