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
		const { getBlockAttributes, getBlockParents, getBlockName } =
			registry.select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const parents = getBlockParents( clientId, true );
		const patternClientId = parents.find(
			( id ) => getBlockName( id ) === 'core/block'
		);

		const overridableValue =
			getBlockAttributes( patternClientId )?.[ CONTENT ]?.[
				currentBlockAttributes?.metadata?.name
			]?.[ attributeName ];

		// If there is no pattern client ID, or it is not overwritten, return the default value.
		if ( ! patternClientId || ! overridableValue ) {
			return currentBlockAttributes[ attributeName ];
		}

		return getBlockAttributes( patternClientId )?.[ CONTENT ]?.[
			currentBlockAttributes?.metadata?.name
		]?.[ attributeName ];
	},
	setValue( { registry, clientId, attributeName, value } ) {
		const { getBlockAttributes, getBlockParents, getBlockName } =
			registry.select( blockEditorStore );
		const parents = getBlockParents( clientId, true );
		const patternClientId = parents.find(
			( id ) => getBlockName( id ) === 'core/block'
		);
		// If there is no pattern client ID, set attributes as normal.
		if ( ! patternClientId ) {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					[ attributeName ]: value,
				} );
			return;
		}

		const currentBlockAttributes = getBlockAttributes( clientId );
		const blockName = currentBlockAttributes?.metadata?.name;
		const currentBindingValue =
			getBlockAttributes( patternClientId )?.[ CONTENT ];
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( patternClientId, {
				[ CONTENT ]: {
					...currentBindingValue,
					[ blockName ]: {
						...currentBindingValue?.[ blockName ],
						[ attributeName ]: value,
					},
				},
			} );
	},
	lockAttributesEditing: false,
};
