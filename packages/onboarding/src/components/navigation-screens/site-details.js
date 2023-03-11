/**
 * WordPress dependencies
 */
import {
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalUseNavigator as useNavigator,
	SelectControl,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NavigationNextButton } from '../navigation-screens';
import { onboardingSteps } from '../sidebar';

const siteCategories = [
	{ value: '', label: __( 'Select a category' ) },
	{ value: 'photography', label: __( 'Photography' ) },
	{ value: 'fashion', label: __( 'Fashion' ) },
	{
		value: 'sports',
		label: __( 'Sports' ),
	},
];

export default function SiteDetails() {
	const navigator = useNavigator();
	const [ category, setCategory ] = useState( '' );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const title = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		return getEditedEntityRecord( 'root', 'site' )?.title;
	}, [] );
	return (
		<VStack className="" spacing={ 4 }>
			<VStack alignment="center" spacing={ 4 }>
				<Heading level={ 2 } size={ 28 }>
					{ __( 'Welcome to your site!' ) }
				</Heading>
				<p>
					{ __(
						"Let's add some information that will help you get started!"
					) }
				</p>
				<TextControl
					label={ __( 'Add a title for your site' ) }
					value={ title || '' }
					onChange={ ( newTitle ) => {
						editEntityRecord( 'root', 'site', undefined, {
							title: newTitle,
						} );
					} }
				/>
			</VStack>
			<Spacer />
			<HStack alignment="center" align="baseline" spacing={ 10 }>
				<VStack spacing={ 4 }>
					<Heading level={ 2 } size={ 28 }>
						{ __( "What's your website about?" ) }
					</Heading>
					<Icon icon="clipboard" size={ 96 } />
				</VStack>
				<VStack>
					<p>
						{ __(
							"Choose a category that best describes your site's purpose."
						) }
					</p>
					<SelectControl
						__nextHasNoMarginBottom
						options={ siteCategories }
						value={ category }
						label={ __( 'Search for a category' ) }
						onChange={ ( newCategory ) =>
							setCategory( newCategory.label )
						}
						help={ __(
							'We will use this information to guide you towards the next steps.'
						) }
					/>
					<NavigationNextButton
						onClick={ () => {
							const nextStep = onboardingSteps.findIndex(
								( { path } ) => path === '/site-details'
							);
							if ( onboardingSteps[ nextStep + 1 ] ) {
								navigator.goTo(
									onboardingSteps[ nextStep + 1 ].path
								);
							}
							saveEditedEntityRecord( 'root', 'site' );
						} }
					>
						{ __( 'Next' ) }
					</NavigationNextButton>
				</VStack>
			</HStack>
		</VStack>
	);
}
