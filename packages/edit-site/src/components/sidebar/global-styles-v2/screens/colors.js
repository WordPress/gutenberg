/**
 * External dependencies
 */
import { take } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	CardBody,
	ColorIndicator,
	__experimentalHStack as HStack,
	ItemGroup,
	Panel,
	PanelHeader,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalView as View,
	__experimentalVStack as VStack,
	__experimentalZStack as ZStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { NavLink, Screen, ScreenHeader } from '../components';
import { useAppState } from '../state';

const Palette = () => {
	const { get } = useAppState();
	const theme = get( 'color.palettes[0].colors' );
	const colors = take( theme, 3 );

	return (
		<Panel>
			<PanelHeader>Palette</PanelHeader>
			<ItemGroup bordered separated>
				<NavLink to="/colors/palette">
					<HStack>
						<Spacer>
							<ZStack isLayered={ false } offset={ -15 }>
								{ colors.map( ( color ) => (
									<ColorIndicator
										colorValue={ color.color }
										key={ color.id }
										circular
									/>
								) ) }
							</ZStack>
						</Spacer>
						<View>
							<Text variant="muted">23 colors</Text>
						</View>
					</HStack>
				</NavLink>
			</ItemGroup>
		</Panel>
	);
};

const Elements = () => {
	const { get } = useAppState();
	const elements = get( 'color.elements' );

	return (
		<Panel>
			<PanelHeader>Elements</PanelHeader>
			<ItemGroup bordered separated>
				{ elements.map( ( element ) => (
					<NavLink
						key={ element.title }
						to={ `/colors/elements/${ element.slug }` }
					>
						<HStack spacing={ 3 }>
							<View>
								<ColorIndicator
									colorValue={ element.color }
									circular
								/>
							</View>
							<Spacer>
								<Text isBlock lineHeight={ 1 }>
									{ element.title }
								</Text>
							</Spacer>
						</HStack>
					</NavLink>
				) ) }
			</ItemGroup>
		</Panel>
	);
};

export const ColorsScreen = () => {
	return (
		<Screen>
			<CardBody>
				<VStack spacing={ 8 }>
					<ScreenHeader
						back="/"
						description={
							'Manages the available colors to use across the site and its blocks.'
						}
						title="Color"
					/>
					<Palette />
					<Elements />
				</VStack>
			</CardBody>
		</Screen>
	);
};
