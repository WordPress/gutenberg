/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';

export default {
	name: 'core/pattern-overrides',
	label: _x( 'Pattern Overrides', 'block bindings source' ),
	useSource( { clientId }, _, attributeName ) {
		const { patternClientId, blockName, placeholder, value } = useSelect(
			( select ) => {
				const {
					getBlockAttributes,
					__unstableGetContentLockingParent,
				} = select( blockEditorStore );
				const currenttBlockAttributes = getBlockAttributes( clientId );
				return {
					patternClientId:
						__unstableGetContentLockingParent( clientId ),
					blockName: currenttBlockAttributes?.metadata?.name,
					placeholder: currenttBlockAttributes?.[ attributeName ],
					value: getBlockAttributes(
						__unstableGetContentLockingParent( clientId )
					)?.content?.[ currenttBlockAttributes?.metadata?.name ]?.[
						attributeName
					],
				};
			},
			[ clientId, attributeName ]
		);
		const { getBlockAttributes } = useSelect( blockEditorStore );
		const { updateBlockAttributes } = useDispatch( blockEditorStore );

		const updateValue = useCallback(
			( newValue ) => {
				const currentBindingValue =
					getBlockAttributes( patternClientId )?.content;
				if ( patternClientId ) {
					updateBlockAttributes( patternClientId, {
						content: {
							...currentBindingValue,
							[ blockName ]: {
								...currentBindingValue[ blockName ],
								[ attributeName ]: newValue,
							},
						},
					} );
				}
			},
			[
				patternClientId,
				blockName,
				attributeName,
				getBlockAttributes,
				updateBlockAttributes,
			]
		);

		return {
			placeholder,
			value,
			updateValue,
		};
	},
	lockAttributesEditing: false,
};
