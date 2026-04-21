/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

export type TaxonomyRecord = {
	id?: number;
	slug: string;
	status: 'publish' | 'draft';
	title: { raw?: string; rendered: string };
	content: { raw?: string; rendered: string };
};

export type StoredConfig = {
	labels?: { singular_name?: string };
	object_type?: string[];
	public?: boolean;
	hierarchical?: boolean;
};

/**
 * Normalized in-memory shape used by all three consumers. REST rows are
 * converted to this shape on load via `toFormData`, and back to the save
 * payload via `serializeForSave`, so fields never have to JSON round-trip
 * `content.raw` on every keystroke.
 */
export type TaxonomyFormData = {
	id?: number;
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string };
	config: Required<
		Pick< StoredConfig, 'object_type' | 'public' | 'hierarchical' >
	> & {
		labels: { singular_name: string };
	};
};

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
	const parsed = parseConfig( row.content?.raw );
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		title: { raw: row.title.raw ?? '' },
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

export function useTakenTaxonomySlugs( excludeSlug?: string ): Set< string > {
	const registered = useSelect(
		( select ) => select( coreStore ).getTaxonomies(),
		[]
	);
	const { records: drafts } = useEntityRecords< { slug: string } >(
		'postType',
		'wp_user_taxonomy',
		{ per_page: 100, status: 'draft', context: 'edit' }
	);
	return useMemo( () => {
		const set = new Set< string >();
		( registered ?? [] ).forEach( ( t: any ) => set.add( t.slug ) );
		( drafts ?? [] ).forEach( ( r ) => set.add( r.slug ) );
		if ( excludeSlug ) {
			set.delete( excludeSlug );
		}
		return set;
	}, [ registered, drafts, excludeSlug ] );
}
