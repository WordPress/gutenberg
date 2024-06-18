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
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import groups from './groups';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';
import { BlockSettingsButton } from '../block-settings';

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
	const context = useBlockEditContext();

	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}
	if ( ! context[ mayDisplayControlsKey ] ) {
		return null;
	}

	return (
		<>
			<Fill { ...props }>
				<BottomSheetConsumer>
					{ () => <View>{ children }</View> }
				</BottomSheetConsumer>
			</Fill>
			{ Children.count( children ) > 0 && <BlockSettingsButton /> }
		</>
	);
}
