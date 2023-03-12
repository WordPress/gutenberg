/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, __experimentalVStack as VStack } from '@wordpress/components';

export const onboardingSteps = [
	{ label: __( 'Site details' ), path: '/site-details' },
	{ label: __( 'Add pages' ), path: '/add-pages' },
];

function SidebarItem( { activeStep, step, children } ) {
	const isAllowed = activeStep >= step;
	return (
		<Button
			disabled={ ! isAllowed }
			className={ classnames( 'onboarding-sidebar__item', {
				'is-allowed': isAllowed,
				'is-active': activeStep === step,
			} ) }
		>
			{ children }
		</Button>
	);
}

function Sidebar( { step = 1 } ) {
	return (
		<div className="onboarding-sidebar">
			<h1 className="onboarding-sidebar__title">
				{ __( 'Bootstrap your site' ) }
			</h1>
			<p>{ __( 'Your website is three clicks a way' ) }</p>

			<VStack className="onboarding-sidebar__steps">
				<SidebarItem activeStep={ step } step={ 1 }>
					{ __( 'Choose a starting site' ) }
				</SidebarItem>
				<SidebarItem activeStep={ step } step={ 2 }>
					{ __( 'Pick the styles' ) }
				</SidebarItem>
				<SidebarItem activeStep={ step } step={ 3 }>
					{ __( 'Launch' ) }
				</SidebarItem>
			</VStack>
		</div>
	);
}

export default memo( Sidebar );
