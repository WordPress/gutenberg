/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalVStack as VStack,
	FlexBlock,
	ColorIndicator,
} from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Subtitle from './subtitle';
import NavigationButton from './navigation-button';
import { useSetting } from './hooks';

const EMPTY_COLORS = [];

function Palette( { name } ) {
	const [ colorsSetting ] = useSetting( 'color.palette.user', name );
	const colors = colorsSetting || EMPTY_COLORS;
	const screenPath = ! name
		? '/colors/palette'
		: '/blocks/' + name + '/colors/palette';

	return (
		<VStack spacing={ 3 }>
			<Subtitle>{ __( 'Palette' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButton path={ screenPath }>
					<HStack>
						<FlexBlock>
							<ZStack isLayered={ false } offset={ -8 }>
								{ colors.slice( 0, 5 ).map( ( { color } ) => (
									<ColorIndicator
										key={ color }
										colorValue={ color }
									/>
								) ) }
							</ZStack>
						</FlexBlock>
						<FlexItem>
							{ sprintf(
								// Translators: %d: Number of palette colors.
								_n( '%d color', '%d colors', colors.length ),
								colors.length
							) }
						</FlexItem>
					</HStack>
				</NavigationButton>
			</ItemGroup>
		</VStack>
	);
}

export default Palette;
