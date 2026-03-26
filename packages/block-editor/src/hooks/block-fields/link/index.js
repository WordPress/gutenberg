/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LinkPicker } from '../../../components/link-picker';

/**
 * Returns the binding configuration for a given entity kind,
 * or undefined if the kind does not support bindings.
 *
 * @param {string} kind The entity kind ('post-type' or 'taxonomy').
 * @return {Object|undefined} The binding config, or undefined.
 */
function getBinding( kind ) {
	if ( kind === 'post-type' ) {
		return { source: 'core/post-data', args: { field: 'link' } };
	}
	if ( kind === 'taxonomy' ) {
		return { source: 'core/term-data', args: { field: 'link' } };
	}
	return undefined;
}

/**
 * Normalizes the type value from a LinkPicker suggestion.
 * Ensures consistency with how types are stored in block attributes.
 *
 * @param {string} type The raw type string from the suggestion.
 * @return {string} The normalized type string.
 */
function normalizeType( type ) {
	if ( ! type ) {
		return type;
	}
	// Use "tag" in favor of "post_tag".
	// See https://github.com/WordPress/gutenberg/pull/24670
	if ( type === 'post_tag' ) {
		return 'tag';
	}
	return type.replace( '-', '_' );
}

export default function Link( { data, field, onChange } ) {
	const value = field.getValue( { item: data } );
	const url = value?.url;

	const preview = {
		title: url || __( 'Add link' ),
		url: url || '',
	};

	return (
		<LinkPicker
			preview={ preview }
			onSelect={ ( suggestion ) => {
				if ( ! suggestion ) {
					return;
				}

				const isEntityLink =
					!! suggestion.id && suggestion.kind !== 'custom';

				onChange(
					field.setValue( {
						item: data,
						value: {
							url: suggestion.url,
							id: isEntityLink ? suggestion.id : undefined,
							kind: isEntityLink ? suggestion.kind : 'custom',
							type: isEntityLink
								? normalizeType( suggestion.type )
								: 'custom',
							binding: isEntityLink
								? getBinding( suggestion.kind )
								: undefined,
						},
					} )
				);
			} }
			label={ field.label }
		/>
	);
}
