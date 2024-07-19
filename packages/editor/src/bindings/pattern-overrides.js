/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

const CONTENT = 'content';

export default {
	name: 'core/pattern-overrides',
	label: _x( 'Pattern Overrides', 'block bindings source' ),
	getValues( { registry, clientId, context, sourceBindings } ) {
		const patternOverridesContent = context[ 'pattern/overrides' ];
		if ( ! patternOverridesContent ) {
			return {};
		}

		const { getBlockAttributes } = registry.select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );

		const overridesValues = {};
		for ( const attributeName of Object.keys( sourceBindings ) ) {
			const overridableValue =
				patternOverridesContent?.[
					currentBlockAttributes?.metadata?.name
				]?.[ attributeName ];
			overridesValues[ attributeName ] =
				overridableValue === '' ? undefined : overridableValue;
		}
		return overridesValues;
	},
	setValues( { registry, clientId, sourceBindings } ) {
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

		// Extract the updated attributes from the source bindings.
		const attributes = Object.entries( sourceBindings ).reduce(
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
	canUserEditValue: () => true,
};
