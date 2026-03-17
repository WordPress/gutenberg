/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from './store';
import { unlock } from './lock-unlock';
import type { ConnectorConfig } from './types';

/**
 * Register a connector that will appear in the Connectors settings page.
 * If a connector with the given slug already exists, the provided config
 * fields will be merged into the existing connector (upsert).
 *
 * @param slug   Unique identifier for the connector.
 * @param config Connector configuration (all fields optional when updating).
 *               Omit keys you don't want to change — passing `undefined`
 *               will overwrite the existing value.
 *
 * @example
 * ```js
 * import { __experimentalRegisterConnector as registerConnector, __experimentalConnectorItem as ConnectorItem } from '@wordpress/connectors';
 *
 * registerConnector( 'my-plugin/openai', {
 *     label: 'OpenAI',
 *     description: 'Text, image, and code generation with GPT.',
 *     icon: <MyOpenAIIcon />,
 *     render: ( { slug, label, description, icon } ) => (
 *         <ConnectorItem
 *             icon={ icon }
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
	config: Partial< Omit< ConnectorConfig, 'slug' > >
): void {
	unlock( dispatch( store ) ).registerConnector( slug, config );
}

/**
 * Unregister a previously registered connector.
 *
 * @param slug Unique identifier of the connector to remove.
 *
 * @example
 * ```js
 * import { __experimentalUnregisterConnector as unregisterConnector } from '@wordpress/connectors';
 *
 * unregisterConnector( 'my-plugin/openai' );
 * ```
 */
export function unregisterConnector( slug: string ): void {
	unlock( dispatch( store ) ).unregisterConnector( slug );
}
