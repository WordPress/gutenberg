/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { StoredConfig, TaxonomyFormData, TaxonomyRecord } from './types';

export function parseConfig( raw?: string ): StoredConfig {
	if ( ! raw ) {
		return {};
	}
	try {
		const parsed = JSON.parse( raw );
		return typeof parsed === 'object' && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}

export function toFormData( row: TaxonomyRecord ): TaxonomyFormData {
	const parsed = parseConfig( row.content.raw );
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		title: { raw: row.title.raw },
		config: {
			labels: {
				singular_name: parsed.labels?.singular_name ?? '',
			},
			object_type: Array.isArray( parsed.object_type )
				? parsed.object_type
				: [],
			public: parsed.public ?? true,
			hierarchical: parsed.hierarchical ?? false,
		},
	};
}

export function serializeForSave( data: TaxonomyFormData ) {
	return {
		...( data.id !== undefined ? { id: data.id } : {} ),
		slug: data.slug,
		status: data.status,
		title: data.title.raw,
		content: JSON.stringify( {
			labels: { singular_name: data.config.labels.singular_name },
			object_type: data.config.object_type,
			public: data.config.public,
			hierarchical: data.config.hierarchical,
		} ),
	};
}

export function usePublicPostTypes() {
	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return postTypes
			?.filter( ( { viewable }: any ) => viewable )
			.sort( ( a: any, b: any ) => {
				// Keep the built-in 'post' type at the top; sort the rest alphabetically.
				if ( a.slug === 'post' || b.slug === 'post' ) {
					return 0;
				}
				return a.name.localeCompare( b.name );
			} );
	}, [ postTypes ] );
}
