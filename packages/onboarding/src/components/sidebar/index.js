/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Header from './header';

const onboardingSteps = [
	{ label: __( 'Site details' ), path: '/site-details' },
	{ label: __( 'Add pages' ), path: '/add-pages' },
];

function Sidebar() {
	const navigator = useNavigator();
	return (
		<>
			<Header />
			<ItemGroup role="list">
				{ onboardingSteps.map( ( step ) => (
					<Item
						role="listitem"
						key={ step.path }
						onClick={ () => navigator.goTo( step.path ) }
						// aria-label={  }
						// aria-current={}
					>
						{ step.label }
					</Item>
				) ) }
			</ItemGroup>
		</>
	);
}

export default memo( Sidebar );
