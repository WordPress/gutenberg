/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import UnsupportedBlockDetails from '../unsupported-block-details';
import { store as blockEditorStore } from '../../store';
import { MAX_NESTING_DEPTH } from './constants';
import useUnsupportedBlockEditor from '../use-unsupported-block-editor';
import {
	useConvertToGroupButtons,
	useConvertToGroupButtonProps,
} from '../convert-to-group-buttons';

const EMPTY_ARRAY = [];

const WarningMaxDepthExceeded = ( { clientId } ) => {
	const [ showDetails, setShowDetails ] = useState( false );

	const isSelected = useSelect(
		( select ) => select( blockEditorStore ).isBlockSelected( clientId ),
		[ clientId ]
	);

	// We rely on the logic related to the Group/Ungroup buttons used in the block options to
	// determine whether to use the Ungroup action.
	const convertToGroupButtonProps = useConvertToGroupButtonProps( [
		clientId,
	] );
	const { isUngroupable } = convertToGroupButtonProps;
	const convertToGroupButtons = useConvertToGroupButtons( {
		...convertToGroupButtonProps,
	} );
	const onUngroup = convertToGroupButtons.ungroup.onSelect;

	const {
		isUnsupportedBlockEditorSupported,
		canEnableUnsupportedBlockEditor,
	} = useUnsupportedBlockEditor( clientId );

	/* translators: Warning related to having blocks deeply nested. %d: The deepest nesting level. */
	const descriptionFormat = __(
		'Blocks nested deeper than %d levels may not render properly in the mobile editor.'
	);
	let description = sprintf( descriptionFormat, MAX_NESTING_DEPTH );
	if (
		! isUnsupportedBlockEditorSupported &&
		! canEnableUnsupportedBlockEditor
	) {
		// When UBE can't be used, the description mentions using the web browser to edit the block.
		description +=
			' ' +
			/* translators: Recommendation included in a warning related to having blocks deeply nested. */
			__(
				'For this reason, we recommend editing the block using your web browser.'
			);
	}
	// Otherwise, the description mentions using the web editor (i.e. UBE).
	else {
		description +=
			' ' +
			/* translators: Recommendation included in a warning related to having blocks deeply nested. */
			__(
				'For this reason, we recommend editing the block using the web editor.'
			);
	}
	// If the block can be flattened, we also suggest to ungroup the block.
	if ( isUngroupable ) {
		description +=
			' ' +
			/* translators: Alternative option included in a warning related to having blocks deeply nested. */
			__(
				'Alternatively, you can flatten the content by ungrouping the block.'
			);
	}

	return (
		<TouchableWithoutFeedback
			disabled={ ! isSelected }
			accessibilityLabel={ __( 'Warning message' ) }
			accessibilityRole="button"
			accessibilityHint={ __( 'Tap here to show more details.' ) }
			onPress={ () => setShowDetails( true ) }
		>
			<View>
				<Warning
					message={ __(
						'Block cannot be rendered because it is deeply nested. Tap here for more details.'
					) }
				/>
				<UnsupportedBlockDetails
					clientId={ clientId }
					showSheet={ showDetails }
					onCloseSheet={ () => setShowDetails( false ) }
					title={ __( 'Deeply nested block' ) }
					description={ description }
					customActions={
						isUngroupable
							? [
									{
										label: __( 'Ungroup block' ),
										onPress: onUngroup,
									},
							  ]
							: EMPTY_ARRAY
					}
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default WarningMaxDepthExceeded;
