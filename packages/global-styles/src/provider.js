/**
 * External dependencies
 */
import { camelCase, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, createContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useRenderedGlobalStyles } from './renderer';

const GlobalStylesContext = createContext( {} );
export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

export function GlobalStylesProvider( { children, baseStyles, userEntityId } ) {
	// Trigger entity retrieval.
	useSelect( ( select ) =>
		select( 'core' ).getEntityRecord(
			'postType',
			'wp_global_styles',
			userEntityId
		)
	);
	const globalStyles = useGlobalStyles( baseStyles, userEntityId );

	return (
		<GlobalStylesContext.Provider value={ globalStyles }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}

function toCase( tree, transformCase ) {
	if ( ! ( tree instanceof Object ) ) {
		return tree;
	}

	const newTree = {};
	for ( const key in tree ) {
		if ( ! tree.hasOwnProperty( key ) ) continue;

		if ( tree[ key ] instanceof Object ) {
			newTree[ transformCase( key ) ] = toCase(
				tree[ key ],
				transformCase
			);
		} else {
			newTree[ transformCase( key ) ] = tree[ key ];
		}
	}
	return newTree;
}

// Make object reference immutable
// so it stays the same in the function setters.
let styles = {};
function useGlobalStyles( baseStyles, userEntityId ) {
	// Start with base styles.
	styles = {
		...toCase( baseStyles, camelCase ),
	};

	// Merge user styles, if any.
	const userData = useSelect( ( select ) =>
		select( 'core' ).getEditedEntityRecord(
			'postType',
			'wp_global_styles',
			userEntityId
		)
	);
	let userStyles = {};
	if ( Object.keys( userData ).length > 0 ) {
		userStyles = toCase( JSON.parse( userData.content ), camelCase );
		styles = {
			color: {
				...styles.color,
				...userStyles.color,
			},
			typography: {
				...styles.typography,
				...userStyles.typography,
			},
		};
	}

	// Convert styles to CSS props.
	useRenderedGlobalStyles( toCase( styles, kebabCase ) );

	// Create and bind function settters to context,
	// so controls can modify the styles.
	const { editEntityRecord } = useDispatch( 'core' );

	const setColor = ( newStyles ) => {
		editEntityRecord( 'postType', 'wp_global_styles', userEntityId, {
			content: JSON.stringify(
				toCase(
					{
						typography: {
							...userStyles.typography,
						},
						color: {
							...userStyles.color,
							...newStyles,
						},
					},
					kebabCase
				)
			),
		} );
	};

	const setTypography = ( newStyles ) => {
		editEntityRecord( 'postType', 'wp_global_styles', userEntityId, {
			content: JSON.stringify(
				toCase(
					{
						color: {
							...userStyles.color,
						},
						typography: {
							...userStyles.typography,
							...newStyles,
						},
					},
					kebabCase
				)
			),
		} );
	};

	// Return context value.
	return {
		...styles,
		setColor,
		setTypography,
	};
}
