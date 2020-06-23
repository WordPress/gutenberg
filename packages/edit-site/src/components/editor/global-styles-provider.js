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

export default ( { children, entityId, baseStyles } ) => {
	const { editEntityRecord } = useDispatch( 'core' );
	const userStyles = useSelect( ( select ) => {
		const userData = select( 'core' ).getEntityRecord(
			'postType',
			'wp_global_styles',
			entityId
		);

		return userData?.content?.raw ? JSON.parse( userData.content.raw ) : {};
	} );

	// Font Size getter & setter
	const fromPx = ( value ) => +value?.replace( 'px', '' ) ?? null;
	const getFontSize = ( blockName ) =>
		fromPx( userStyles?.[ blockName ]?.styles?.typography?.fontSize ) ??
		null;
	const setFontSize = ( blockName, newValue ) =>
		editEntityRecord( 'postType', 'wp_global_styles', entityId, {
			content: JSON.stringify( {
				[ blockName ]: {
					styles: {
						typography: {
							fontSize: newValue,
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
				[ blockName ]: {
					styles: {
						typography: {
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
