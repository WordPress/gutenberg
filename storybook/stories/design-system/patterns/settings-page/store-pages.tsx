import type { ComponentProps } from 'react';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useId, useState } from '@wordpress/element';
import { Badge, Card } from '@wordpress/ui';
import type { SubpageStatus } from './router';
import { RouterNavLink, SubpageLink } from './router';
import type { GatewaySettings } from './shared';
import {
	checkoutFields,
	emailFields,
	emailSettings,
	gatewayFields,
	GATEWAYS,
	gatewaySettings,
	gatewayStatus,
	generalFields,
	generalSettings,
	paymentFields,
	paymentSettings,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';
import styles from './style.module.css';

export const ADJACENT_PAGES = [
	{ label: 'General', href: '/general' },
	{ label: 'Payments', href: '/payments' },
	{ label: 'Emails', href: '/emails' },
];

/**
 * The saved values for every page, held above the router so they survive
 * navigation.
 */
export function useStoreSettings() {
	const [ general, setGeneral ] = useState( generalSettings );
	const [ payments, setPayments ] = useState( paymentSettings );
	const [ gateways, setGateways ] = useState( gatewaySettings );
	const [ emails, setEmails ] = useState( emailSettings );
	const setGateway = ( id: string, value: GatewaySettings ) =>
		setGateways( ( current ) => ( { ...current, [ id ]: value } ) );
	return {
		general,
		setGeneral,
		payments,
		setPayments,
		gateways,
		setGateway,
		emails,
		setEmails,
	};
}

export const GATEWAYS_PATH = '/payment-gateways';

/**
 * The gateway a subpage path points to, if any.
 */
export function gatewayFromPath( path: string ) {
	return GATEWAYS.find(
		( gateway ) => path === `${ GATEWAYS_PATH }/${ gateway.id }`
	);
}

type StoreSettings = ReturnType< typeof useStoreSettings >;

type HeaderProps = Pick<
	ComponentProps< typeof SettingsFormPage >,
	| 'title'
	| 'subTitle'
	| 'breadcrumbs'
	| 'ariaLabel'
	| 'navigation'
	| 'components'
>;

/**
 * The settings area at the root of a subpage's trail. There is no separate
 * Settings page, so it leads to the first adjacent page.
 */
export const SETTINGS_CRUMB = {
	label: 'Settings',
	to: ADJACENT_PAGES[ 0 ].href,
};

/**
 * Header props for a page that sits among adjacent pages. The title names
 * the area, and the navigation shows which page is current.
 */
export function adjacentPageHeader( currentHref: string ): HeaderProps {
	return {
		title: 'Settings',
		navigation: { items: ADJACENT_PAGES, currentHref },
		components: { link: RouterNavLink },
	};
}

/**
 * Header props for a subpage. The breadcrumb trail stands in for the title,
 * so the page region takes its name from the last crumb.
 */
export function subpageHeader(
	trail: Array< { label: string; to?: string } >
): HeaderProps {
	return {
		breadcrumbs: <Breadcrumbs items={ trail } />,
		ariaLabel: trail[ trail.length - 1 ].label,
	};
}

export function GeneralPage( {
	settings,
	header,
}: {
	settings: StoreSettings;
	header: HeaderProps;
} ) {
	return (
		<SettingsFormPage
			{ ...header }
			saved={ settings.general }
			onSave={ settings.setGeneral }
		>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection
						title="Store details"
						description="How your store is presented to customers."
					>
						<SettingsForm
							data={ data }
							fields={ generalFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					<SettingsSection title="Checkout">
						<SettingsForm
							data={ data }
							fields={ checkoutFields }
							onChange={ onChange }
						/>
					</SettingsSection>
				</>
			) }
		</SettingsFormPage>
	);
}

/**
 * A card that lists subpages, one row each. The rows are links in a list
 * named by the card title, so screen readers announce the group and its
 * size.
 */
export function SubpageListSection( {
	title,
	description,
	items,
}: {
	title: string;
	description: string;
	items: Array< { to: string; label: string; status?: SubpageStatus } >;
} ) {
	const titleId = useId();
	return (
		<SettingsSection
			title={ title }
			titleId={ titleId }
			description={ description }
		>
			<Card.FullBleed>
				{ /*
				 * Disable reason: The `list` ARIA role is redundant but
				 * Safari+VoiceOver won't announce the list otherwise.
				 */
				/* eslint-disable jsx-a11y/no-redundant-roles */ }
				<ul
					role="list"
					aria-labelledby={ titleId }
					className={ styles[ 'subpage-list' ] }
				>
					{ items.map( ( item ) => (
						<li key={ item.to }>
							<SubpageLink to={ item.to } status={ item.status }>
								{ item.label }
							</SubpageLink>
						</li>
					) ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Card.FullBleed>
		</SettingsSection>
	);
}

/**
 * The payment gateways card, with a row for each gateway's subpage.
 */
export function GatewaysSection( { settings }: { settings: StoreSettings } ) {
	return (
		<SubpageListSection
			title="Payment gateways"
			description="Connect the services that process payments."
			items={ GATEWAYS.map( ( gateway ) => ( {
				to: `${ GATEWAYS_PATH }/${ gateway.id }`,
				label: gateway.name,
				status: gatewayStatus( settings.gateways[ gateway.id ] ),
			} ) ) }
		/>
	);
}

export function PaymentsPage( {
	settings,
	header,
	showGateways,
}: {
	settings: StoreSettings;
	header: HeaderProps;
	showGateways?: boolean;
} ) {
	return (
		<SettingsFormPage
			{ ...header }
			saved={ settings.payments }
			onSave={ settings.setPayments }
		>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection title="Payments">
						<SettingsForm
							data={ data }
							fields={ paymentFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					{ showGateways && (
						<GatewaysSection settings={ settings } />
					) }
				</>
			) }
		</SettingsFormPage>
	);
}

export function GatewayPage( {
	gatewayId,
	settings,
	header,
}: {
	gatewayId: string;
	settings: StoreSettings;
	header: HeaderProps;
} ) {
	// The badge reflects the saved settings, so it changes on Save, not while
	// the draft is being edited.
	const status = gatewayStatus( settings.gateways[ gatewayId ] );
	return (
		<SettingsFormPage
			{ ...header }
			badges={ <Badge intent={ status.intent }>{ status.label }</Badge> }
			saved={ settings.gateways[ gatewayId ] }
			onSave={ ( value ) => settings.setGateway( gatewayId, value ) }
		>
			{ ( { data, onChange } ) => (
				<SettingsSection
					title="Credentials"
					description="Find these in your payment provider’s dashboard."
				>
					<SettingsForm
						data={ data }
						fields={ gatewayFields }
						onChange={ onChange }
					/>
				</SettingsSection>
			) }
		</SettingsFormPage>
	);
}

export function EmailsPage( {
	settings,
	header,
}: {
	settings: StoreSettings;
	header: HeaderProps;
} ) {
	return (
		<SettingsFormPage
			{ ...header }
			saved={ settings.emails }
			onSave={ settings.setEmails }
		>
			{ ( { data, onChange } ) => (
				<SettingsSection
					title="Sender"
					description="Who order emails come from."
				>
					<SettingsForm
						data={ data }
						fields={ emailFields }
						onChange={ onChange }
					/>
				</SettingsSection>
			) }
		</SettingsFormPage>
	);
}
