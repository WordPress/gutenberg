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
import { useSetting } from '../editor/utils';
import NavigationButton from './navigation-button';

function Palette( { contextName } ) {
	const colors = useSetting( 'color.palette', contextName );
	const screenPath =
		contextName === 'root'
			? '/colors/palette'
			: '/blocks/' + contextName + '/colors/palette';

	return (
		<div className="edit-site-global-style-palette">
			<VStack spacing={ 1 }>
				<Subtitle>{ __( 'Palette' ) }</Subtitle>
				<ItemGroup isBordered isSeparated>
					<NavigationButton path={ screenPath }>
						<HStack>
							<FlexBlock>
								<ZStack isLayered={ false } offset={ -8 }>
									{ colors
										.slice( 0, 5 )
										.map( ( { color } ) => (
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
									_n(
										'%d color',
										'%d colors',
										colors.length
									),
									colors.length
								) }
							</FlexItem>
						</HStack>
					</NavigationButton>
				</ItemGroup>
			</VStack>
		</div>
	);
}

export default Palette;
