/**
 * External dependencies
 */
import { pickBy, mapValues, isEmpty, mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

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
const createWithMetaAttributeSource = ( metaAttributes ) => createHigherOrderComponent(
	( BlockEdit ) => ( { attributes, setAttributes, ...props } ) => {
		const postType = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType(), [] );
		const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

		const mergedAttributes = useMemo(
			() => ( {
				...attributes,
				...mapValues( metaAttributes, ( metaKey ) => meta[ metaKey ] ),
			} ),
			[ attributes, meta ]
		);

		return (
			<BlockEdit
				attributes={ mergedAttributes }
				setAttributes={ ( nextAttributes ) => {
					const nextMeta = mapKeys(
						// Filter to intersection of keys between the updated
						// attributes and those with an associated meta key.
						pickBy( nextAttributes, ( value, key ) => metaAttributes[ key ] ),

						// Rename the keys to the expected meta key name.
						( value, attributeKey ) => metaAttributes[ attributeKey ],
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
	const metaAttributes = mapValues( pickBy( settings.attributes, { source: 'meta' } ), 'meta' );
	if ( ! isEmpty( metaAttributes ) ) {
		settings.edit = createWithMetaAttributeSource( metaAttributes )( settings.edit );
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);
