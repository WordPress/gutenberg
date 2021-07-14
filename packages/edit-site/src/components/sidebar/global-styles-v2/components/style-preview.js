/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	__experimentalView as View,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useAppState } from '../state';

export const StylePreview = () => {
	const { get } = useAppState();
	const fontFamily = get( 'typography.fontFamily' );
	const themeColors = get( 'color.palettes' ).find(
		( p ) => p.title === 'Theme'
	);
	const [ main, text, accent ] = themeColors.colors.map( ( i ) => i.color );

	return (
		<View style={ { background: main, padding: '32px 20px' } }>
			<VStack spacing={ 5 }>
				<View style={ { fontFamily, fontSize: 24 } }>
					{ fontFamily }
				</View>
				<View style={ { fontFamily, fontSize: 16 } }>
					{ fontFamily }
				</View>
				<HStack>
					<Spacer>
						<View style={ { background: text, height: 8 } } />
					</Spacer>
					<Spacer>
						<View style={ { background: accent, height: 8 } } />
					</Spacer>
				</HStack>
			</VStack>
		</View>
	);
};
