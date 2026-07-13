/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/pattern-overrides',
	getValues( { select, clientId, context, bindings } ) {
		const patternOverridesContent = context[ 'pattern/overrides' ];
		const { getBlockAttributes } = select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );

		const overridesValues = {};
		for ( const attributeName of Object.keys( bindings ) ) {
			const overridableValue =
				patternOverridesContent?.[
					currentBlockAttributes?.metadata?.name
				]?.[ attributeName ];

			// If it has not been overridden, return the original value.
			// Check undefined because empty string is a valid value.
			if ( overridableValue === undefined ) {
				overridesValues[ attributeName ] =
					currentBlockAttributes?.[ attributeName ];
				continue;
			} else {
				overridesValues[ attributeName ] =
					overridableValue === '' ? undefined : overridableValue;
			}
		}
		return overridesValues;
	},
	setValues( { select, dispatch, clientId, bindings } ) {
		const { getBlockAttributes, getBlockName, getBlockParents, getBlocks } =
			select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const blockName = currentBlockAttributes?.metadata?.name;
		if ( ! blockName ) {
			return;
		}

		// The closest provider owns the overrides. Its context mapping also tells us
		// which attribute stores them.
		const { getBlockType } = select( blocksStore );
		const patternClientId = getBlockParents( clientId, true ).find(
			( parentId ) =>
				getBlockType( getBlockName( parentId ) )?.providesContext?.[
					'pattern/overrides'
				]
		);

		// Extract the updated attributes from the source bindings.
		const attributes = Object.entries( bindings ).reduce(
			( attrs, [ key, { newValue } ] ) => {
				attrs[ key ] = newValue;
				return attrs;
			},
			{}
		);

		// If there is no pattern client ID, sync blocks with the same name and same attributes.
		if ( ! patternClientId ) {
			const syncBlocksWithSameName = ( blocks ) => {
				for ( const block of blocks ) {
					if ( block.attributes?.metadata?.name === blockName ) {
						dispatch( blockEditorStore ).updateBlockAttributes(
							block.clientId,
							attributes
						);
					}
					syncBlocksWithSameName( block.innerBlocks );
				}
			};

			syncBlocksWithSameName( getBlocks() );
			return;
		}
		const contentAttribute = getBlockType( getBlockName( patternClientId ) )
			.providesContext[ 'pattern/overrides' ];
		const currentBindingValue =
			getBlockAttributes( patternClientId )?.[ contentAttribute ];

		dispatch( blockEditorStore ).updateBlockAttributes( patternClientId, {
			[ contentAttribute ]: {
				...currentBindingValue,
				[ blockName ]: {
					...currentBindingValue?.[ blockName ],
					...Object.entries( attributes ).reduce(
						( acc, [ key, value ] ) => {
							// TODO: We need a way to represent `undefined` in the serialized overrides.
							// Also see: https://github.com/WordPress/gutenberg/pull/57249#discussion_r1452987871
							// We use an empty string to represent undefined for now until
							// we support a richer format for overrides and the block bindings API.
							acc[ key ] = value === undefined ? '' : value;
							return acc;
						},
						{}
					),
				},
			},
		} );
	},
	canUserEditValue: () => true,
};
