/**
 * Internal dependencies
 */
import type {
	FieldRenderConfig,
	NormalizedField,
	NormalizedFieldRenderConfig,
} from './types';

/**
 * Normalizes all the default field render configs
 * To simplify its usage in the code base.
 *
 * @param configs Field Render Configs.
 * @param fields  Fields config.
 * @return Normalized field render configs.
 */
export function normalizeFieldRenderConfigs(
	configs: FieldRenderConfig[] | undefined,
	fields: NormalizedField< any >[]
): NormalizedFieldRenderConfig[] {
	return configs
		? configs.map( ( config ) => {
				if ( typeof config === 'string' ) {
					return { render: 'default', field: config };
				}

				return config;
		  } )
		: fields.map( ( f ) => ( { render: 'default', field: f.id } ) );
}
