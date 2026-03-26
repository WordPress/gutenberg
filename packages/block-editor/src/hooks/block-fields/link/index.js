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

/**
 * Default preview component used when no Preview is provided via config.
 * Returns a basic preview with just the URL as the title.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.value    The link field value.
 * @param {Function} props.children Render prop receiving the preview object.
 * @return {Object} Rendered children with preview data.
 */
function DefaultFieldLinkPreview( { value, children } ) {
	const url = value?.url;
	return children( {
		title: url || __( 'Add link' ),
		url: url || '',
	} );
}

export default function Link( { data, field, onChange, config } ) {
	const value = field.getValue( { item: data } );
	const PreviewProvider = config?.Preview || DefaultFieldLinkPreview;

	return (
		<PreviewProvider value={ value }>
			{ ( preview ) => (
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
									id: isEntityLink
										? suggestion.id
										: undefined,
									kind: isEntityLink
										? suggestion.kind
										: 'custom',
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
			) }
		</PreviewProvider>
	);
}
