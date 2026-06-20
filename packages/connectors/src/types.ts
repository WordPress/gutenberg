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
	file: string;
	isInstalled: boolean;
	isActivated: boolean;
}

/**
 * The stored data type of a connector field, mirroring the data types
 * accepted by the PHP `register_setting()` / `register_meta()` APIs.
 */
export type ConnectorFieldType =
	| 'string'
	| 'boolean'
	| 'integer'
	| 'number'
	| 'array'
	| 'object';

/**
 * The UI control rendered for a connector field. Distinct from the stored
 * data {@link ConnectorFieldType}: a field can store a `string` yet render as
 * a `url`, `password`, `select`, or `textarea`. `custom` signals that the
 * value is rendered by a plugin-provided component through a slot-fill
 * (future work).
 */
export type ConnectorFieldControl =
	| 'text'
	| 'url'
	| 'email'
	| 'number'
	| 'password'
	| 'textarea'
	| 'select'
	| 'checkbox'
	| 'custom';

/**
 * Where the effective value for a field ultimately came from.
 *
 * Controls whether the input is read-only (`env` / `constant`) and what help
 * message the field presents to the user.
 */
export type FieldValueSource = 'env' | 'constant' | 'database' | 'none';

/**
 * A single typed configuration field declared on a connector via the PHP
 * {@code register_connector_field()} API. The shape mirrors the PHP-side
 * {@code configSchema} entry emitted by the script-module-data filter.
 */
export interface ConnectorField {
	/** Field slug, stable identifier unique within a connector. */
	name: string;
	/** The stored data type. */
	type: ConnectorFieldType;
	/** The UI control to render. */
	control: ConnectorFieldControl;
	/** Translatable label rendered above the input. */
	label: string;
	/** Optional translatable help text rendered below the input. */
	description?: string;
	/** Placeholder shown inside the empty input. */
	placeholder?: string;
	/** Underlying WordPress option name. */
	settingName: string;
	/** Current value (already masked if {@link ConnectorField.sensitive}). */
	value: string | number | boolean | null;
	/** Registered default. */
	default: string | number | boolean | null;
	/** Resolution source of the current value. */
	source: FieldValueSource;
	/** Whether the value must be masked on display / in transit. */
	sensitive: boolean;
	/** Whether the input must be rendered read-only (env / constant sources). */
	readOnly: boolean;
	/** Whether a value is stored anywhere (env, constant or database). */
	isStored: boolean;
	/** For `select` / `checkbox` fields: `[value => label]` option map. */
	choices?: Record< string, string > | null;
	/** Optional URL where the user can acquire the value (e.g. API key console). */
	credentialsUrl?: string | null;
}

export interface ConnectorRenderProps {
	slug: string;
	name: string;
	description: string;
	type?: string;
	logo?: ReactNode;
	authentication?: ConnectorAuthentication;
	plugin?: ConnectorPlugin;
	/** Typed configuration fields for this connector. */
	configSchema?: ConnectorField[];
}

export interface ConnectorConfig {
	slug: string;
	name: string;
	description: string;
	type?: string;
	logo?: ReactNode;
	authentication?: ConnectorAuthentication;
	plugin?: ConnectorPlugin;
	/** Typed configuration fields for this connector. */
	configSchema?: ConnectorField[];
	render?: ( props: ConnectorRenderProps ) => ReactNode;
}

export interface ConnectorsState {
	connectors: Record< string, ConnectorConfig >;
}
