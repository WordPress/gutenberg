/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { BottomSheetConsumer } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BlockSettingsButton } from '../block-settings';
import useInspectorControlsFill from './hook';

export default function InspectorControlsFill( {
	__experimentalGroup: group = 'default',
	__experimentalExposeToChildren = false,
	children,
	...props
} ) {
	const Fill = useInspectorControlsFill(
		group,
		__experimentalExposeToChildren
	);
	if ( ! Fill ) {
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
