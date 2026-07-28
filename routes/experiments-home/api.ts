/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export interface Experiment {
	id: string;
	label: string;
	description: string;
	group: string;
	groupLabel: string;
}

interface SettingsSchema {
	schema?: {
		properties?: {
			'gutenberg-experiments'?: {
				properties?: Record<
					string,
					{
						title?: string;
						description?: string;
						group?: string;
						group_label?: string;
						separate_option?: boolean;
						option_name?: string;
					}
				>;
			};
		};
	};
}

export async function fetchExperiments(): Promise< Experiment[] > {
	const response = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'OPTIONS',
	} ) ) as SettingsSchema;

	const properties =
		response?.schema?.properties?.[ 'gutenberg-experiments' ]?.properties ??
		{};

	return Object.entries( properties ).map( ( [ id, schema ] ) => ( {
		id,
		label: schema.title ?? id,
		description: schema.description ?? '',
		group: schema.group ?? 'other',
		groupLabel: schema.group_label ?? '',
	} ) );
}
