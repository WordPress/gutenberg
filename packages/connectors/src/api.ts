/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store, STORE_NAME } from './store';
import { ConnectorItem, DefaultConnectorSettings } from './connector-item';
import type { ConnectorConfig, ConnectorRenderProps } from './types';

export type { ConnectorConfig, ConnectorRenderProps };

/**
 * Register a connector that will appear in the Connectors settings page.
 *
 * @param slug   Unique identifier for the connector.
 * @param config Connector configuration.
 *
 * @example
 * ```js
 * import { registerConnector, ConnectorItem } from '@wordpress/connectors';
 *
 * registerConnector( 'my-plugin/openai', {
 *     label: 'OpenAI',
 *     description: 'Text, image, and code generation with GPT.',
 *     icon: <MyOpenAIIcon />,
 *     render: ( { slug, label, description } ) => (
 *         <ConnectorItem
 *             icon={ <MyOpenAIIcon /> }
 *             name={ label }
 *             description={ description }
 *         >
 *             <MyCustomSettings />
 *         </ConnectorItem>
 *     ),
 * } );
 * ```
 */
export function registerConnector(
	slug: string,
	config: Omit< ConnectorConfig, 'slug' >
): void {
	dispatch( store ).registerConnector( slug, config );
}

export { ConnectorItem, DefaultConnectorSettings, store, STORE_NAME };
