/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export interface ConnectorRenderProps {
	slug: string;
	label: string;
	description: string;
}

export interface ConnectorConfig {
	slug: string;
	label: string;
	description: string;
	icon?: ReactNode;
	render?: ( props: ConnectorRenderProps ) => ReactNode;
}

export interface ConnectorsState {
	connectors: Record< string, ConnectorConfig >;
}
