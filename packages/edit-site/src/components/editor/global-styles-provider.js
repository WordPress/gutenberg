/**
 * WordPress dependencies
 */
import { createContext, useContext, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

const GlobalStylesContext = createContext( {
	getFontSize: () => {},
	setFontSize: () => {},
	getLineHeight: () => {},
	setLineHeight: () => {},
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( { children, entityId, baseStyles } ) => {
	const {
		userStyles,
		getFontSize,
		setFontSize,
		getLineHeight,
		setLineHeight,
	} = useGlobalStylesFromEntities( entityId );

	useGlobalStylesEffectToUpdateStylesheet( baseStyles, userStyles );

	return (
		<GlobalStylesContext.Provider
			value={ { getFontSize, setFontSize, getLineHeight, setLineHeight } }
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

	// Font Size getter & setter
	const fromPx = ( value ) => +value?.replace( 'px', '' ) ?? null;
	const toPx = ( value ) => value + 'px';

	const getFontSize = ( blockName ) =>
		fromPx( userStyles?.[ blockName ]?.styles?.typography?.fontSize ) ??
		null;

	const setFontSize = ( blockName, newValue ) =>
		editEntityRecord( 'postType', 'wp_global_styles', entityId, {
			content: JSON.stringify( {
				...userStyles,
				[ blockName ]: {
					styles: {
						...userStyles[ blockName ].styles,
						typography: {
							...userStyles[ blockName ].styles.typography,
							fontSize: toPx( newValue ),
						},
					},
				},
			} ),
		} );

	// Line height getter & setter
	const getLineHeight = ( blockName ) =>
		userStyles?.[ blockName ]?.styles?.typography?.lineHeight ?? null;
	const setLineHeight = ( blockName, newValue ) =>
		editEntityRecord( 'postType', 'wp_global_styles', entityId, {
			content: JSON.stringify( {
				...userStyles,
				[ blockName ]: {
					styles: {
						...userStyles[ blockName ].styles,
						typography: {
							...userStyles[ blockName ].styles.typography,
							lineHeight: newValue,
						},
					},
				},
			} ),
		} );

	return {
		userStyles,
		getFontSize,
		setFontSize,
		getLineHeight,
		setLineHeight,
	};
};

const useGlobalStylesEffectToUpdateStylesheet = ( baseStyles, userStyles ) => {
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

		// TODO: look at how to hook into the styles generation
		// so we can avoid having to increase the class specificity here.
		styleNode.innerText = `.editor-styles-wrapper.editor-styles-wrapper p {
			font-size: 42px;
			line-height: 2;
		}`;
	}, [ baseStyles, userStyles ] );
};
