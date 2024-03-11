/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as blocksStore } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';

import { unlock } from '../lock-unlock';

function removeBindings( bindings, syncedAttributes ) {
	let updatedBindings = {};
	for ( const attributeName of syncedAttributes ) {
		// Omit any pattern override bindings from the `updatedBindings` object.
		if (
			bindings?.[ attributeName ]?.source !== 'core/pattern-overrides' &&
			bindings?.[ attributeName ]?.source !== undefined
		) {
			updatedBindings[ attributeName ] = bindings[ attributeName ];
		}
	}
	if ( ! Object.keys( updatedBindings ).length ) {
		updatedBindings = undefined;
	}
	return updatedBindings;
}

function addBindings( bindings, syncedAttributes ) {
	const updatedBindings = { ...bindings };
	for ( const attributeName of syncedAttributes ) {
		if ( ! bindings?.[ attributeName ] ) {
			updatedBindings[ attributeName ] = {
				source: 'core/pattern-overrides',
			};
		}
	}
	return updatedBindings;
}

export default function useSetPatternBindings(
	{ name, attributes, setAttributes },
	currentPostType
) {
	const hasPatternOverridesSource = useSelect( ( select ) => {
		const { getBlockBindingsSource } = unlock( select( blocksStore ) );

		// For editing link to the site editor if the theme and user permissions support it.
		return !! getBlockBindingsSource( 'core/pattern-overrides' );
	}, [] );

	const metadataName = attributes?.metadata?.name ?? '';
	const prevMetadataName = usePrevious( metadataName ) ?? '';
	const bindings = attributes?.metadata?.bindings;

	useEffect( () => {
		// Bindings should only be created when editing a wp_block post type,
		// and also when there's a change to the user-given name for the block.
		// Also check that the pattern overrides source is registered.
		if (
			! hasPatternOverridesSource ||
			currentPostType !== 'wp_block' ||
			metadataName === prevMetadataName
		) {
			return;
		}

		const syncedAttributes = PARTIAL_SYNCING_SUPPORTED_BLOCKS[ name ];
		const attributeSources = syncedAttributes.map(
			( attributeName ) =>
				attributes.metadata?.bindings?.[ attributeName ]?.source
		);
		const isConnectedToOtherSources = attributeSources.every(
			( source ) => source && source !== 'core/pattern-overrides'
		);

		// Avoid overwriting other (e.g. meta) bindings.
		if ( isConnectedToOtherSources ) {
			return;
		}

		// The user-given name for the block was deleted, remove the bindings.
		if ( ! metadataName?.length && prevMetadataName?.length ) {
			const updatedBindings = removeBindings(
				bindings,
				syncedAttributes
			);
			setAttributes( {
				metadata: {
					...attributes.metadata,
					bindings: updatedBindings,
				},
			} );
		}

		// The user-given name for the block was set, set the bindings.
		if ( ! prevMetadataName?.length && metadataName.length ) {
			const updatedBindings = addBindings( bindings, syncedAttributes );
			setAttributes( {
				metadata: {
					...attributes.metadata,
					bindings: updatedBindings,
				},
			} );
		}
	}, [
		hasPatternOverridesSource,
		bindings,
		prevMetadataName,
		metadataName,
		currentPostType,
		name,
		attributes.metadata,
		setAttributes,
	] );
}
