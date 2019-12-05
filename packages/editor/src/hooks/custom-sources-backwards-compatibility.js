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
 * Object mapping an attribute key to its corresponding meta property.
 *
 * @typedef {Object<string,string>} WPMetaAttributeMapping
 */

/**
 * Given a meta attribute mapping, returns a new higher-order component which
 * manages attributes merging and updates to consume from and mirror to the
 * associated entity record.
 *
 * @param {WPMetaAttributeMapping} metaKeys Meta attribute mapping.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */
const createWithMetaAttributeSource = ( metaKeys ) => createHigherOrderComponent(
	( BlockEdit ) => ( { attributes, setAttributes, name, ...props } ) => {
		const postType = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType() );
		const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

		const mergedAttributes = useMemo(
			() => ( {
				...attributes,
				...mapValues( metaKeys, ( metaKey ) => meta[ metaKey ] ),
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
						pickBy( nextAttributes, ( value, key ) => metaKeys[ key ] ),

						// Rename the keys to the expected meta key name.
						( value, attributeKey ) => metaKeys[ attributeKey ],
					);

					if ( ! isEmpty( nextMeta ) ) {
						setMeta( nextMeta );
					}

					setAttributes( nextAttributes );
				} }
				name={ name }
				{ ...props }
			/>
		);
	},
	'withMetaAttributeSource'
);

/**
 * Filters a registered block settings to enhance a block's `edit` component to
 * upgrade meta-sourced attributes to use the post's meta entity property.
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
