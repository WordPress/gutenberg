/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetConsumer } from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import groups from './groups';
import useDisplayBlockControls from '../use-display-block-controls';

export default function InspectorControlsFill( {
	children,
	group = 'default',
	__experimentalGroup,
	...props
} ) {
	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsFill`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
		group = __experimentalGroup;
	}
	const isDisplayed = useDisplayBlockControls();

	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
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
		</>
	);
}
