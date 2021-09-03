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
import { useBlockEditContext } from '../block-edit/context';
import { BlockSettingsButton } from '../block-settings';

export default function InspectorControlsFill( {
	children,
	__experimentalGroup: group = 'default',
	...props
} ) {
	const { isSelected } = useBlockEditContext();
	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}
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
}
