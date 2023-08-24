/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from 'uuid';
// TODO: Fix the unique ID generation to avoid adding another dependency just for this.

/**
 * WordPress dependencies
 */
import { getBlockSupport, getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';

export const PATTERN_SUPPORT_KEY = '__experimentalPattern';

function hasPatternSupport( blockType ) {
	return !! getBlockSupport( blockType, PATTERN_SUPPORT_KEY );
}

// TODO: Extract this to a custom source file?
function useSource( {
	name,
	context: { dynamicContent, patternId },
	attributes,
	setAttributes,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockType = getBlockType( name );
	const patternSupport = blockType.supports?.[ PATTERN_SUPPORT_KEY ];
	// Generate unique id to link the block instance with the data in the
	// pattern block's dynamic content.

	const attributesWithSourcedAttributes = useMemo( () => {
		const id = attributes.metadata?.id;

		if ( ! patternSupport || ! id || ! dynamicContent ) {
			return attributes;
		}

		return {
			...attributes,
			...Object.fromEntries(
				Object.keys( patternSupport ).map( ( attributeName ) => {
					return [
						attributeName,
						dynamicContent[ id ]?.[ attributeName ] ||
							attributes[ attributeName ],
					];
				} )
			),
		};
	}, [ attributes, dynamicContent, patternSupport ] );

	const updatedSetAttributes = useCallback(
		( nextAttributes ) => {
			const id = attributes.metadata?.id ?? uuid();

			// Collect the updated dynamic content for the current block.
			const updatedDynamicContent = Object.entries( nextAttributes ?? {} )
				.filter(
					( [ key ] ) => patternSupport && key in patternSupport
				)
				.map( ( [ key, value ] ) => {
					if ( value === '' ) {
						return [ key, undefined ];
					}

					return [ key, value ];
				} );

			// Collect the updated dynamic pattern content.
			const nextDynamicContent = cleanEmptyObject( {
				...dynamicContent,
				[ id ]: {
					...dynamicContent?.[ id ],
					...Object.fromEntries( updatedDynamicContent ),
				},
			} );

			// Filter out pattern stored attributes so they don't override the
			// original attributes that act as a default or fallback.
			const updatedAttributes = updatedDynamicContent.length
				? Object.fromEntries(
						Object.entries( nextAttributes ?? {} ).filter(
							( [ key ] ) =>
								! ( patternSupport && key in patternSupport )
						)
				  )
				: nextAttributes;

			// Update the parent pattern instance's dynamic content attribute.
			if ( updatedDynamicContent.length ) {
				// If we are setting dynamic content on the parent pattern,
				// ensure the block's id is saved in its metadata.
				if ( ! attributes.metadata?.id ) {
					updatedAttributes.metadata = {
						...updatedAttributes.metadata,
						id,
					};
				}

				updateBlockAttributes( patternId, {
					dynamicContent: nextDynamicContent,
				} );
			}

			setAttributes( updatedAttributes );
		},
		[
			attributes.metadata?.id,
			dynamicContent,
			patternId,
			patternSupport,
			setAttributes,
			updateBlockAttributes,
		]
	);

	return {
		attributes: attributesWithSourcedAttributes,
		setAttributes: updatedSetAttributes,
	};
}

/**
 * Filters registered block settings, extending usesContext to include the
 * dynamic content and setter provided by a pattern block.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function extendUsesContext( settings ) {
	if ( ! hasPatternSupport( settings ) ) {
		return settings;
	}

	if ( ! Array.isArray( settings.usesContext ) ) {
		settings.usesContext = [ 'dynamicContent', 'patternId' ];
		return settings;
	}

	if ( ! settings.usesContext.includes( 'dynamicContent' ) ) {
		settings.usesContext.push( 'dynamicContent' );
	}

	if ( ! settings.usesContext.includes( 'patternId' ) ) {
		settings.usesContext.push( 'patternId' );
	}

	return settings;
}

/**
 * Creates a higher order component that overrides the `attributes` and
 * `setAttributes` props to sync changes to the pattern's dynamic content
 * attribute. The original attributes should remain in tact so they can be used
 * as fallback content. The original attributes will be those set in the source
 * pattern's inner blocks.
 *
 * TODO: Double check that the last couple of sentences above are correct.
 */
const createEditFunctionWithPatternSource = () =>
	createHigherOrderComponent(
		( BlockEdit ) =>
			( { name, attributes, setAttributes, context, ...props } ) => {
				if ( ! context.patternId ) {
					return (
						<BlockEdit
							name={ name }
							context={ context }
							attributes={ attributes }
							setAttributes={ setAttributes }
							{ ...props }
						/>
					);
				}

				const registry = useRegistry();
				const {
					attributes: updatedAttributes,
					setAttributes: updatedSetAttributes,
				} = useSource( { name, attributes, setAttributes, context } );

				return (
					<BlockEdit
						name={ name }
						context={ context }
						attributes={ updatedAttributes }
						setAttributes={ ( newAttributes ) =>
							registry.batch( () =>
								updatedSetAttributes( newAttributes )
							)
						}
						{ ...props }
					/>
				);
			}
	);

function shimAttributeSource( settings ) {
	settings.edit = createEditFunctionWithPatternSource()( settings.edit );

	return settings;
}

if ( window.__experimentalPatterns ) {
	addFilter(
		'blocks.registerBlockType',
		'core/pattern/shimAttributeSource',
		shimAttributeSource
	);

	addFilter(
		'blocks.registerBlockType',
		'core/pattern/extendUsesContext',
		extendUsesContext
	);
}
