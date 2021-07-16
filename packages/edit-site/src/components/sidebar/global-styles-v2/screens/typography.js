/**
 * WordPress dependencies
 */
import {
	CardBody,
	__experimentalHStack as HStack,
	ItemGroup,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalView as View,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { NavLink, Screen, ScreenHeader } from '../components';
import { useAppState } from '../state';

const FontPreview = ( { styles } ) => {
	return (
		<div
			style={ {
				...styles,
				fontSize: 13,
				lineHeight: '20px',
				height: 20,
				textAlign: 'center',
				display: 'block',
			} }
		>
			Aa
		</div>
	);
};

const Elements = () => {
	const [ elements ] = useAppState( 'typography.elements' );
	return (
		<ItemGroup bordered>
			{ elements.map( ( element ) => (
				<NavLink
					key={ element.id }
					to={ `/typography/elements/${ element.slug }` }
				>
					<HStack spacing={ 3 }>
						<View>
							<FontPreview styles={ element.styles } />
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
	);
};

export const TypographyScreen = () => {
	return (
		<Screen>
			<CardBody>
				<VStack spacing={ 8 }>
					<ScreenHeader
						back="/"
						description={
							'Manage the available fonts to use across the site and its blocks.'
						}
						title="Typography"
					/>
					<Elements />
				</VStack>
			</CardBody>
		</Screen>
	);
};
