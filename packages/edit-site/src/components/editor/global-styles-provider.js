/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

const GlobalStylesContext = createContext( {
	getFontSize: () => {},
	setFontSize: () => {},
	getLineHeight: () => {},
	setLineHeight: () => {},
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( { children, entityId, stylesheetId, baseStyles } ) => {
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

	console.log( 'base styles ', baseStyles );
	console.log( 'stylesheet id ', stylesheetId );

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
						typography: {
							...userStyles[ blockName ].styles.typography,
							lineHeight: newValue,
						},
					},
				},
			} ),
		} );

	return (
		<GlobalStylesContext.Provider
			value={ { getFontSize, setFontSize, getLineHeight, setLineHeight } }
		>
			{ children }
		</GlobalStylesContext.Provider>
	);
};
