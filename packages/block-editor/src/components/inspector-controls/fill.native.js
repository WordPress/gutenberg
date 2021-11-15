/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { BottomSheetConsumer } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';
import useDisplayBlockControls from '../use-display-block-controls';
import { BlockSettingsButton } from '../block-settings';

export default function InspectorControlsFill( {
	children,
	__experimentalGroup: group = 'default',
	...props
} ) {
	const isDisplayed = useDisplayBlockControls();

	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}
	if ( ! isDisplayed ) {
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
}
