/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const GlobalStylesContext = createContext( {
	getFontSize: () => {},
	setFontSize: () => {},
	getLineHeight: () => {},
	setLineHeight: () => {},
} );

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export default ( { children, entityId, baseStyles } ) => {
	// Trigger entity retrieval.
	const userStyles = useSelect( ( select ) => {
		const userData = select( 'core' ).getEntityRecord(
			'postType',
			'wp_global_styles',
			entityId
		);

		return userData?.content?.raw ? JSON.parse( userData.content.raw ) : {};
	} );

	const fromPx = ( value ) => +value?.replace( 'px', '' ) ?? null;
	const getFontSize = ( blockName ) =>
		fromPx( userStyles?.[ blockName ]?.styles?.typography?.fontSize ) ??
		null;

	const setFontSize = ( blockName, newValue ) =>
		console.log( 'set font size' );

	const getLineHeight = ( blockName ) =>
		userStyles?.[ blockName ]?.styles?.typography?.lineHeight ?? null;
	const setLineHeight = ( blockName, newValue ) =>
		console.log( 'set line height' );

	return (
		<GlobalStylesContext.Provider
			value={ { getFontSize, setFontSize, getLineHeight, setLineHeight } }
		>
			{ children }
		</GlobalStylesContext.Provider>
	);
};
