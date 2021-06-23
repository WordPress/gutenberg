/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';
import { get, kebabCase, set, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { COLOR_ACCENT, COLOR_MAIN, COLOR_TEXT } from './constants';

// Models
const createPaletteColor = ( { color, slug } ) => ( {
	id: uuid(),
	slug,
	color,
	title: startCase( slug ),
} );

const createPalette = ( { colors, title } ) => ( {
	id: uuid(),
	title,
	colors,
} );

const createElement = ( { title, ...rest } ) => ( {
	...rest,
	id: uuid(),
	title,
	slug: kebabCase( title ),
} );

// App State
const initialState = {
	color: {
		palettes: [
			createPalette( {
				title: 'Theme',
				colors: [
					createPaletteColor( { slug: 'main', color: COLOR_MAIN } ),
					createPaletteColor( { slug: 'text', color: COLOR_TEXT } ),
					createPaletteColor( {
						slug: 'accent',
						color: COLOR_ACCENT,
					} ),
				],
			} ),

			createPalette( {
				title: 'Default',
				colors: [
					createPaletteColor( { slug: 'black', color: '#000' } ),
					createPaletteColor( { slug: 'gray', color: '#AEB8C2' } ),
					createPaletteColor( { slug: 'white', color: '#fff' } ),
					createPaletteColor( { slug: 'pink', color: '#E992A7' } ),
					createPaletteColor( { slug: 'red', color: '#BE3E37' } ),
					createPaletteColor( { slug: 'orange', color: '#ED732D' } ),
					createPaletteColor( { slug: 'yellow', color: '#F1BC40' } ),
					createPaletteColor( {
						slug: 'lightGreen',
						color: '#91D9B6',
					} ),
					createPaletteColor( { slug: 'green', color: '#5FCC8C' } ),
					createPaletteColor( { slug: 'sky', color: '#9BCFF7' } ),
					createPaletteColor( { slug: 'blue', color: '#4291DD' } ),
					createPaletteColor( { slug: 'purple', color: '#9055D9' } ),
				],
			} ),

			createPalette( {
				title: 'Custom',
				colors: [
					createPaletteColor( { slug: 'cyan', color: '#19C9D5' } ),
					createPaletteColor( { slug: 'royal', color: '#3858E9' } ),
					createPaletteColor( {
						slug: 'tangerine',
						color: '#F38435',
					} ),
				],
			} ),
		],
		elements: [
			createElement( { title: 'Background', color: COLOR_MAIN } ),
			createElement( { title: 'Text', color: COLOR_TEXT } ),
		],
	},
	typography: {
		fontFamily: 'Helvetica Neue',
		elements: [
			createElement( {
				title: 'Headings',
				styles: {
					fontFamily: 'Helvetica Neue',
					fontWeight: 600,
					fontSize: '18px',
					lineHeight: 1.2,
				},
			} ),
			createElement( {
				title: 'Text',
				styles: { fontFamily: 'Helvetica Neue', fontSize: '14px' },
			} ),
			createElement( {
				title: 'Links',
				styles: {
					fontFamily: 'Helvetica Neue',
					fontSize: '14px',
					textDecoration: 'underline',
				},
			} ),
			createElement( {
				title: 'Captions',
				styles: { fontFamily: 'Helvetica Neue', fontSize: '11px' },
			} ),
		],
	},
};

export const AppState = createContext( {} );

export const useAppState = ( getAppState ) => {
	const appState = useContext( AppState );
	const { setAppState } = appState;

	const setFn = useCallback(
		( value ) => {
			if ( ! getAppState ) return;
			setAppState( getAppState, value );
		},
		[ getAppState, setAppState ]
	);

	if ( getAppState ) {
		return [ appState.get( getAppState ), setFn ];
	}
	return appState;
};
export const useStyleAttribute = useAppState;

export const AppProvider = ( { children } ) => {
	const [ appState, setAppState ] = useState( initialState );
	const [ colorPickerKey, setColorPickerKey ] = useState( null );
	const [ showColorPicker, setShowColorPicker ] = useState( false );

	const contextValue = {
		...appState,
		setAppState,
		set: ( key, value ) =>
			setAppState( ( prev ) => {
				const next = set( prev, key, value );
				/* eslint-disable no-console */
				console.group( 'setAppState' );
				console.table( { key, value } );
				console.groupEnd();
				/* eslint-enable no-console */
				return { ...prev, ...next };
			} ),
		get: ( values ) => get( appState, values ),

		// Show color picker
		colorPickerKey,
		setColorPickerKey,
		showColorPicker,
		setShowColorPicker,
		toggleShowColorPicker: () => setShowColorPicker( ( prev ) => ! prev ),
	};

	return (
		<AppState.Provider value={ contextValue }>
			{ children }
		</AppState.Provider>
	);
};
