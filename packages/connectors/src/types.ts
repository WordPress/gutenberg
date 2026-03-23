/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ApiKeySource = 'env' | 'constant' | 'database' | 'none';

export type ConnectorAuthentication =
	| {
			method: 'api_key';
			settingName: string;
			credentialsUrl: string | null;
			keySource?: ApiKeySource;
			isConnected?: boolean;
	  }
	| { method: 'none' };

export interface ConnectorPlugin {
	slug: string;
	isInstalled: boolean;
	isActivated: boolean;
}

export interface ConnectorRenderProps {
	slug: string;
	name: string;
	description: string;
	logo?: ReactNode;
	authentication?: ConnectorAuthentication;
	plugin?: ConnectorPlugin;
}

export interface ConnectorConfig {
	slug: string;
	name: string;
	description: string;
	logo?: ReactNode;
	authentication?: ConnectorAuthentication;
	plugin?: ConnectorPlugin;
	render?: ( props: ConnectorRenderProps ) => ReactNode;
}

export interface ConnectorsState {
	connectors: Record< string, ConnectorConfig >;
}
