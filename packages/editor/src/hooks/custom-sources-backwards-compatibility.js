/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useEntityProp } from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const EMPTY_OBJECT = {};
function useMetaAttributeSource( name, _attributes, _setAttributes ) {
	const { attributes: attributeTypes = EMPTY_OBJECT } =
		getBlockType( name ) || EMPTY_OBJECT;
	let [ attributes, setAttributes ] = [ _attributes, _setAttributes ];

	if ( Object.values( attributeTypes ).some( ( type ) => type.source === 'meta' ) ) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const [ meta, setMeta ] = useEntityProp( 'postType', 'post', 'meta' );

		// eslint-disable-next-line react-hooks/rules-of-hooks
		attributes = useMemo(
			() => ( {
				..._attributes,
				...Object.keys( attributeTypes ).reduce( ( acc, key ) => {
					if ( attributeTypes[ key ].source === 'meta' ) {
						acc[ key ] = meta[ attributeTypes[ key ].meta ];
					}
					return acc;
				}, {} ),
			} ),
			[ attributeTypes, meta, _attributes ]
		);

		// eslint-disable-next-line react-hooks/rules-of-hooks
		setAttributes = useCallback(
			( ...args ) => {
				Object.keys( args[ 0 ] ).forEach( ( key ) => {
					if ( attributeTypes[ key ].source === 'meta' ) {
						setMeta( { [ attributeTypes[ key ].meta ]: args[ 0 ][ key ] } );
					}
				} );
				return _setAttributes( ...args );
			},
			[ attributeTypes, setMeta, _setAttributes ]
		);
	}

	return [ attributes, setAttributes ];
}
const withMetaAttributeSource = createHigherOrderComponent(
	( BlockListBlock ) => ( { attributes, setAttributes, name, ...props } ) => {
		[ attributes, setAttributes ] = useMetaAttributeSource(
			name,
			attributes,
			setAttributes
		);
		return (
			<BlockListBlock
				attributes={ attributes }
				setAttributes={ setAttributes }
				name={ name }
				{ ...props }
			/>
		);
	},
	'withMetaAttributeSource'
);

addFilter(
	'editor.BlockListBlock',
	'core/editor/custom-sources-backwards-compatibility/with-meta-attribute-source',
	withMetaAttributeSource
);
