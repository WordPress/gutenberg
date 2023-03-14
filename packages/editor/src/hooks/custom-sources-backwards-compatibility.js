/**
 * External dependencies
 */
import { mapValues, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { select as globalSelect, useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Object whose keys are the names of block attributes, where each value
 * represents the meta key to which the block attribute is intended to save.
 *
 * @see https://developer.wordpress.org/reference/functions/register_meta/
 *
 * @typedef {Object<string,string>} WPMetaAttributeMapping
 */

/**
 * Given a mapping of attribute names (meta source attributes) to their
 * associated meta key, returns a higher order component that overrides its
 * `attributes` and `setAttributes` props to sync any changes with the edited
 * post's meta keys.
 *
 * @param {WPMetaAttributeMapping} metaAttributes Meta attribute mapping.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */
const createWithMetaAttributeSource = ( metaAttributes ) =>
	createHigherOrderComponent(
		( BlockEdit ) =>
			( { attributes, setAttributes, ...props } ) => {
				const postType = useSelect(
					( select ) => select( editorStore ).getCurrentPostType(),
					[]
				);
				const [ meta, setMeta ] = useEntityProp(
					'postType',
					postType,
					'meta'
				);

				const mergedAttributes = useMemo(
					() => ( {
						...attributes,
						...mapValues(
							metaAttributes,
							( metaKey ) => meta[ metaKey ]
						),
					} ),
					[ attributes, meta ]
				);

				return (
					<BlockEdit
						attributes={ mergedAttributes }
						setAttributes={ ( nextAttributes ) => {
							const nextMeta = Object.fromEntries(
								Object.entries( nextAttributes ?? {} )
									.filter(
										// Filter to intersection of keys between the updated
										// attributes and those with an associated meta key.
										( [ key ] ) => key in metaAttributes
									)
									.map( ( [ attributeKey, value ] ) => [
										// Rename the keys to the expected meta key name.
										metaAttributes[ attributeKey ],
										value,
									] )
							);

							if ( ! isEmpty( nextMeta ) ) {
								setMeta( nextMeta );
							}

							setAttributes( nextAttributes );
						} }
						{ ...props }
					/>
				);
			},
		'withMetaAttributeSource'
	);

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade meta-sourced attributes to use the post's meta entity property.
 *
 * @param {WPBlockSettings} settings Registered block settings.
 *
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings ) {
	/** @type {WPMetaAttributeMapping} */
	const metaAttributes = mapValues(
		Object.fromEntries(
			Object.entries( settings.attributes ?? {} ).filter(
				( [ , { source } ] ) => source === 'meta'
			)
		),
		'meta'
	);
	if ( ! isEmpty( metaAttributes ) ) {
		settings.edit = createWithMetaAttributeSource( metaAttributes )(
			settings.edit
		);
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);

// The above filter will only capture blocks registered after the filter was
// added. There may already be blocks registered by this point, and those must
// be updated to apply the shim.
//
// The following implementation achieves this, albeit with a couple caveats:
// - Only blocks registered on the global store will be modified.
// - The block settings are directly mutated, since there is currently no
//   mechanism to update an existing block registration. This is the reason for
//   `getBlockType` separate from `getBlockTypes`, since the latter returns a
//   _copy_ of the block registration (i.e. the mutation would not affect the
//   actual registered block settings).
//
// `getBlockTypes` or `getBlockType` implementation could change in the future
// in regards to creating settings clones, but the corresponding end-to-end
// tests for meta blocks should cover against any potential regressions.
//
// In the future, we could support updating block settings, at which point this
// implementation could use that mechanism instead.
globalSelect( blocksStore )
	.getBlockTypes()
	.map( ( { name } ) => globalSelect( blocksStore ).getBlockType( name ) )
	.forEach( shimAttributeSource );
