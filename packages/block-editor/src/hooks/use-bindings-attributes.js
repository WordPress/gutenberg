/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a binding of block attributes, returns a higher order component that
 * overrides its `attributes` and `setAttributes` props to sync any changes needed.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */

export const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

const createEditFunctionWithBindingsAttribute = () =>
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { attributes: updatedAttributes, name: blockName } = props;

			// active sources state
			const [ sourcesState, setSourcesState ] = useState();

			useEffect( () => {
				Object.entries( sourcesState || {} ).forEach(
					( [ attributeName, [ placeholder, metaValue ] ] ) => {
						if ( placeholder && ! metaValue ) {
							// If the attribute is `src` or `href`, a placeholder can't be used because it is not a valid url.
							// Adding this workaround until attributes and metadata fields types are improved and include `url`.
							const htmlAttribute =
								getBlockType( blockName ).attributes[
									attributeName
								].attribute;
							if (
								htmlAttribute === 'src' ||
								htmlAttribute === 'href'
							) {
								updatedAttributes[ attributeName ] = null;
							} else {
								updatedAttributes[ attributeName ] =
									placeholder;
							}
						}

						if ( metaValue ) {
							updatedAttributes[ attributeName ] = metaValue;
						}
					}
				);
			}, [ sourcesState, blockName ] );

			return (
				<>
					{ Object.entries(
						updatedAttributes?.metadata?.bindings || {}
					).map( ( [ attributeName, settings ] ) => (
						<SourceWrapper
							key={ attributeName }
							attributeName={ attributeName }
							settings={ settings }
							setSourcesState={ setSourcesState }
							{ ...props }
						/>
					) ) }
					<BlockEdit
						key="edit"
						{ ...props }
						attributes={ updatedAttributes }
					/>
				</>
			);
		},
		'useBoundAttributes'
	);

/*
 * A wrapper component for sources to avoid breaking the "rules of hooks" when
 * using hooks in a loop.
 */
const SourceWrapper = ( {
	attributeName,
	settings,
	setSourcesState,
	...props
} ) => {
	const { getBlockBindingsSource } = unlock( useSelect( blockEditorStore ) );
	const source = getBlockBindingsSource( settings.source );

	const { placeholder, useValue: [ metaValue = null ] = [] } =
		source.useSource( props, settings.args );

	useEffect( () => {
		if ( ! source ) {
			return;
		}

		setSourcesState( ( prevState ) => ( {
			...prevState,
			[ attributeName ]: [ placeholder, metaValue ],
		} ) );
	}, [
		source,
		settings.source,
		settings.attribute,
		attributeName,
		metaValue,
		setSourcesState,
		placeholder,
	] );

	return null;
};

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade bound attributes.
 *
 * @param {WPBlockSettings} settings Registered block settings.
 *
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings ) {
	if ( ! ( settings.name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
		return settings;
	}
	settings.edit = createEditFunctionWithBindingsAttribute()( settings.edit );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);

// Add the context to all blocks.
addFilter(
	'blocks.registerBlockType',
	'core/block-bindings-ui',
	( settings, name ) => {
		if ( ! ( name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
			return settings;
		}
		const contextItems = [ 'postId', 'postType', 'queryId' ];
		const usesContextArray = settings.usesContext;
		const oldUsesContextArray = new Set( usesContextArray );
		contextItems.forEach( ( item ) => {
			if ( ! oldUsesContextArray.has( item ) ) {
				usesContextArray.push( item );
			}
		} );
		settings.usesContext = usesContextArray;
		return settings;
	}
);
