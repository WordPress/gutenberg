/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { createSlotFill, BottomSheetConsumer } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockClientId } from '../block-edit';
import { BlockSettingsButton } from '../block-settings';
import { store as blockEditorStore } from '../../store';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

const FillWithSettingsButton = ( { children, ...props } ) => {
	const clientId = useBlockClientId();
	const isSelected = useSelect(
		( select ) => select( blockEditorStore ).isBlockSelected( clientId ),
		[ clientId ]
	);

	if ( ! isSelected ) {
		return null;
	}

	return (
		<>
			<Fill { ...props }>
				{
					<BottomSheetConsumer>
						{ () => <View>{ children }</View> }
					</BottomSheetConsumer>
				}
			</Fill>
			{ Children.count( children ) > 0 && <BlockSettingsButton /> }
		</>
	);
};

const InspectorControls = FillWithSettingsButton;

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
