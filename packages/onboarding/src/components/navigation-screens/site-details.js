/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalUseNavigator as useNavigator,
	SelectControl,
	Icon,
	FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NavigationNextButton } from '../navigation-screens';
import { onboardingSteps } from '../sidebar';
import { ThemePicker } from '../theme-picker';

const siteCategories = [
	{ value: '', label: __( 'Select a category' ) },
	{ value: 'blog', label: __( 'Blog' ) },
	{ value: 'e-ecommerce', label: __( 'E-Commerce' ) },
	{ value: 'education', label: __( 'Education' ) },
	{ value: 'entertainment', label: __( 'Entertainment' ) },
	{ value: 'holiday', label: __( 'Holiday' ) },
	{ value: 'news', label: __( 'News' ) },
	{ value: 'photography', label: __( 'Photography' ) },
	{ value: 'food-and-drink', label: __( 'Food & Drink' ) },
	{
		value: 'portfolio',
		label: __( 'Portfolio' ),
	},
];

export default function SiteDetails( {
	theme,
	setTheme,
	category,
	setCategory,
} ) {
	const navigator = useNavigator();
	return (
		<VStack spacing={ 8 } style={ { minHeight: '100%' } }>
			<HStack spacing={ 4 } alignment="top">
				<HStack alignment="left">
					<Icon icon="clipboard" />
					<Heading level={ 2 }>
						{ __( "What's your website about?" ) }
					</Heading>
				</HStack>

				<SelectControl
					__nextHasNoMarginBottom
					options={ siteCategories }
					value={ category }
					label={ __( 'Search for a category' ) }
					onChange={ ( newCategory ) => setCategory( newCategory ) }
					help={ __(
						'We will use this information to guide you towards the next steps.'
					) }
				/>
			</HStack>
			<FlexItem isBlock>
				{ category && (
					<ThemePicker
						category={ category }
						setTheme={ setTheme }
						theme={ theme }
					/>
				) }
			</FlexItem>
			<NavigationNextButton
				onClick={ () => {
					const nextStep = onboardingSteps.findIndex(
						( { path } ) => path === '/site-details'
					);
					if ( onboardingSteps[ nextStep + 1 ] ) {
						navigator.goTo( onboardingSteps[ nextStep + 1 ].path );
					}
				} }
			>
				{ __( 'Next' ) }
			</NavigationNextButton>
		</VStack>
	);
}
