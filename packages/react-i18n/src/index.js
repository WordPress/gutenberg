/**
 * WordPress dependencies
 */
import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	useCallback,
} from '@wordpress/element';
import { createI18n, getLocaleData } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const SCRIPT_HANDLES = [];

const Context = createContext( null );

export function LocaleProvider( { locale: initialLocale, domain, children } ) {
	const [ locale, setLocale ] = useState( initialLocale );
	const [ localeMap, setLocaleMap ] = useState( () => {
		return new Map().set(
			initialLocale,
			createI18n( getLocaleData( domain ), domain )
		);
	} );

	const switchToLocale = useCallback(
		( newLocale ) => {
			if ( ! localeMap.get( newLocale ) ) {
				setLocaleMap(
					new Map(
						localeMap.set( newLocale, createI18n( {}, domain ) )
					)
				);
			}
			setLocale( newLocale );
		},
		[ localeMap ]
	);

	// Adds new locale data (= translations) and updates the map to force a re-render.
	const setLocaleData = useCallback(
		( data ) => {
			localeMap.get( locale ).setLocaleData( data );
			setLocaleMap(
				new Map( localeMap.set( locale, localeMap.get( locale ) ) )
			);
		},
		[ locale, localeMap ]
	);

	// TODO: Do some caching.
	useEffect( () => {
		async function fetchTranslations() {
			const result = await apiFetch( {
				path: addQueryArgs( `/__experimental/translations`, {
					handles: SCRIPT_HANDLES,
					locale,
				} ),
			} );

			for ( const translations of Object.values( result ) ) {
				const localeData =
					translations.locale_data[ domain ] ||
					translations.locale_data.messages;
				localeData[ '' ].domain = domain;

				localeMap.get( locale ).setLocaleData( localeData );
			}

			setLocaleMap(
				new Map( localeMap.set( locale, localeMap.get( locale ) ) )
			);
		}

		if ( 'en_US' !== locale ) {
			fetchTranslations();
		}
	}, [ locale, domain ] );

	const value = useMemo( () => {
		const { __, _x, _n, _nx, isRtl } = localeMap?.get( locale ) || {};

		return {
			locale,
			__,
			_x,
			_n,
			_nx,
			isRtl,
			setLocaleData,
			switchToLocale,
		};
	}, [ locale, localeMap, setLocaleData ] );

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}

/**
 * React hook used to retrieve the layout config.
 */
export function useTranslate() {
	return useContext( Context );
}

export function addHandle( handle ) {
	SCRIPT_HANDLES.push( handle );
}
