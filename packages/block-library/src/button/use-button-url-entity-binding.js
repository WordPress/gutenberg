/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useBlockBindingsUtils } from '@wordpress/block-editor';

/**
 * Builds `metadata.bindings.url` from a LinkControl entity value.
 *
 * Entity identity is stored in binding args (not block attributes): `core/button`
 * already uses the `type` attribute for the HTML `<button type>`, so we use
 * `postType` in args for posts. `postType` is also required on the JS side because
 * the core-data store resolves posts via getEditedEntityRecord( 'postType', slug, id ).
 *
 * @param {Object} linkValue LinkControl value including `id`, `kind`, and `type` (entity slug).
 * @return {Object|null} Argument for `updateBlockBindings`, or null if not an entity link.
 */
export function buildButtonUrlEntityBinding( linkValue ) {
	const { id, kind, type: entitySlug } = linkValue;

	if ( id === undefined || id === null || ! kind ) {
		return null;
	}

	// Media library results from fetchLinkSuggestions use kind `media` (not `post-type`).
	if ( kind === 'media' ) {
		return {
			url: {
				source: 'core/post-data',
				args: {
					field: 'link',
					id,
					postType: 'attachment',
				},
			},
		};
	}

	if ( kind === 'post-type' ) {
		if ( ! entitySlug ) {
			return null;
		}
		return {
			url: {
				source: 'core/post-data',
				args: {
					field: 'link',
					id,
					postType: entitySlug,
				},
			},
		};
	}

	if ( kind === 'taxonomy' ) {
		if ( ! entitySlug ) {
			return null;
		}
		const taxonomy = entitySlug === 'tag' ? 'post_tag' : entitySlug;
		return {
			url: {
				source: 'core/term-data',
				args: {
					field: 'link',
					id,
					taxonomy,
				},
			},
		};
	}

	return null;
}

/**
 * Block bindings helpers for Button entity URLs (post / term).
 *
 * @param {Object}           props
 * @param {string}           props.clientId Block client id.
 * @param {Object|undefined} props.metadata Block metadata (in attributes).
 * @return {Object} Binding helpers and LinkControl entity props derived from args.
 */
export function useButtonUrlEntityBinding( { clientId, metadata } ) {
	const { updateBlockBindings } = useBlockBindingsUtils( clientId );
	const urlBinding = metadata?.bindings?.url;

	const entityLinkControlProps = useMemo( () => {
		if ( ! urlBinding?.args?.id ) {
			return {};
		}
		if (
			urlBinding.source === 'core/post-data' &&
			urlBinding.args.postType
		) {
			const postType = urlBinding.args.postType;
			if ( postType === 'attachment' ) {
				return {
					id: urlBinding.args.id,
					kind: 'media',
					type: 'attachment',
				};
			}
			return {
				id: urlBinding.args.id,
				kind: 'post-type',
				type: postType,
			};
		}
		if (
			urlBinding.source === 'core/term-data' &&
			urlBinding.args.taxonomy
		) {
			const taxonomy = urlBinding.args.taxonomy;
			return {
				id: urlBinding.args.id,
				kind: 'taxonomy',
				type: taxonomy === 'post_tag' ? 'tag' : taxonomy,
			};
		}
		return {};
	}, [ urlBinding ] );

	const clearUrlBinding = useCallback( () => {
		if ( metadata?.bindings?.url ) {
			updateBlockBindings( { url: undefined } );
		}
	}, [ metadata?.bindings?.url, updateBlockBindings ] );

	const createBinding = useCallback(
		( linkValue ) => {
			const binding = buildButtonUrlEntityBinding( linkValue );
			if ( binding ) {
				updateBlockBindings( binding );
			}
		},
		[ updateBlockBindings ]
	);

	const hasEntityUrlBinding =
		( urlBinding?.source === 'core/post-data' ||
			urlBinding?.source === 'core/term-data' ) &&
		urlBinding?.args?.id !== undefined &&
		urlBinding?.args?.id !== null;

	return {
		createBinding,
		clearUrlBinding,
		entityLinkControlProps,
		hasEntityUrlBinding,
	};
}
