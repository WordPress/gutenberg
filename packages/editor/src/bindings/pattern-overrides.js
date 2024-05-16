/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

const CONTENT = 'content';

export default {
	name: 'core/pattern-overrides',
	label: _x( 'Pattern Overrides', 'block bindings source' ),
	getValue( { registry, clientId, attributeName } ) {
		const { getBlockAttributes, getBlockParentsByBlockName } =
			registry.select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const [ patternClientId ] = getBlockParentsByBlockName(
			clientId,
			'core/block',
			true
		);

		const overridableValue =
			getBlockAttributes( patternClientId )?.[ CONTENT ]?.[
				currentBlockAttributes?.metadata?.name
			]?.[ attributeName ];

		// If there is no pattern client ID, or it is not overwritten, return the default value.
		if ( ! patternClientId || overridableValue === undefined ) {
			return currentBlockAttributes[ attributeName ];
		}

		return overridableValue === '' ? undefined : overridableValue;
	},
	setValues( { registry, clientId, attributes } ) {
		const { getBlockAttributes, getBlockParentsByBlockName, getBlocks } =
			registry.select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const blockName = currentBlockAttributes?.metadata?.name;
		if ( ! blockName ) {
			return;
		}

		const [ patternClientId ] = getBlockParentsByBlockName(
			clientId,
			'core/block',
			true
		);

		// If there is no pattern client ID, sync blocks with the same name and same attributes.
		if ( ! patternClientId ) {
			const syncBlocksWithSameName = ( blocks ) => {
				for ( const block of blocks ) {
					if ( block.attributes?.metadata?.name === blockName ) {
						registry
							.dispatch( blockEditorStore )
							.updateBlockAttributes(
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
		const currentBindingValue =
			getBlockAttributes( patternClientId )?.[ CONTENT ];
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( patternClientId, {
				[ CONTENT ]: {
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
	lockAttributesEditing: false,
};
