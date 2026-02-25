/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export type PluginStatus = 'checking' | 'not-installed' | 'inactive' | 'active';

interface UseConnectorPluginOptions {
	pluginSlug: string;
	settingName: string;
}

interface UseConnectorPluginReturn {
	pluginStatus: PluginStatus;
	isExpanded: boolean;
	setIsExpanded: ( expanded: boolean ) => void;
	isBusy: boolean;
	isConnected: boolean;
	currentApiKey: string;
	handleButtonClick: () => void;
	getButtonLabel: () => string;
	saveApiKey: ( apiKey: string ) => Promise< void >;
	removeApiKey: () => Promise< void >;
}

export function useConnectorPlugin( {
	pluginSlug,
	settingName,
}: UseConnectorPluginOptions ): UseConnectorPluginReturn {
	const [ pluginStatus, setPluginStatus ] =
		useState< PluginStatus >( 'checking' );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ currentApiKey, setCurrentApiKey ] = useState( '' );

	const isConnected =
		pluginStatus === 'active' &&
		currentApiKey !== '' &&
		currentApiKey !== 'invalid_key';

	// Fetch the current API key
	const fetchApiKey = useCallback( async () => {
		try {
			const settings = await apiFetch< Record< string, string > >( {
				path: `/wp/v2/settings?_fields=${ settingName }`,
			} );
			const key = settings[ settingName ] || '';
			setCurrentApiKey( key === 'invalid_key' ? '' : key );
		} catch {
			// Ignore errors
		}
	}, [ settingName ] );

	// Check plugin status on mount
	useEffect( () => {
		const checkPluginStatus = async () => {
			try {
				const plugins = await apiFetch<
					Array< { plugin: string; status: string } >
				>( {
					path: '/wp/v2/plugins',
				} );

				const plugin = plugins.find(
					( p ) => p.plugin === `${ pluginSlug }/plugin`
				);

				if ( ! plugin ) {
					setPluginStatus( 'not-installed' );
				} else if ( plugin.status === 'active' ) {
					await fetchApiKey();
					setPluginStatus( 'active' );
				} else {
					setPluginStatus( 'inactive' );
				}
			} catch {
				setPluginStatus( 'not-installed' );
			}
		};

		checkPluginStatus();
	}, [ pluginSlug, fetchApiKey ] );

	const installPlugin = async () => {
		setIsBusy( true );
		try {
			await apiFetch( {
				method: 'POST',
				path: '/wp/v2/plugins',
				data: { slug: pluginSlug, status: 'active' },
			} );
			setPluginStatus( 'active' );
			await fetchApiKey();
			setIsExpanded( true );
		} catch {
			// Handle error
		} finally {
			setIsBusy( false );
		}
	};

	const activatePlugin = async () => {
		setIsBusy( true );
		try {
			await apiFetch( {
				method: 'PUT',
				path: `/wp/v2/plugins/${ pluginSlug }/plugin`,
				data: { status: 'active' },
			} );
			setPluginStatus( 'active' );
			await fetchApiKey();
			setIsExpanded( true );
		} catch {
			// Handle error
		} finally {
			setIsBusy( false );
		}
	};

	const handleButtonClick = () => {
		if ( pluginStatus === 'not-installed' ) {
			installPlugin();
		} else if ( pluginStatus === 'inactive' ) {
			activatePlugin();
		} else {
			setIsExpanded( ! isExpanded );
		}
	};

	const getButtonLabel = () => {
		if ( isBusy ) {
			return pluginStatus === 'not-installed'
				? __( 'Installing…' )
				: __( 'Activating…' );
		}
		if ( isExpanded ) {
			return __( 'Cancel' );
		}
		if ( isConnected ) {
			return __( 'Edit' );
		}
		switch ( pluginStatus ) {
			case 'checking':
				return __( 'Checking…' );
			case 'not-installed':
				return __( 'Install' );
			case 'inactive':
				return __( 'Activate' );
			case 'active':
				return __( 'Set up' );
		}
	};

	const saveApiKey = async ( apiKey: string ) => {
		try {
			const result = await apiFetch< Record< string, string > >( {
				method: 'POST',
				path: `/wp/v2/settings?_fields=${ settingName }`,
				data: {
					[ settingName ]: apiKey,
				},
			} );

			// If we sent a non-empty key but the returned value didn't
			// change, the server rejected the update (validation failed).
			if ( apiKey && result[ settingName ] === currentApiKey ) {
				throw new Error(
					'It was not possible to connect to the provider using this key.'
				);
			}

			setCurrentApiKey( result[ settingName ] || '' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to save API key:', error );
			throw error;
		}
	};

	const removeApiKey = async () => {
		try {
			await apiFetch( {
				method: 'POST',
				path: `/wp/v2/settings?_fields=${ settingName }`,
				data: {
					[ settingName ]: '',
				},
			} );
			setCurrentApiKey( '' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to remove API key:', error );
			throw error;
		}
	};

	return {
		pluginStatus,
		isExpanded,
		setIsExpanded,
		isBusy,
		isConnected,
		currentApiKey,
		handleButtonClick,
		getButtonLabel,
		saveApiKey,
		removeApiKey,
	};
}
