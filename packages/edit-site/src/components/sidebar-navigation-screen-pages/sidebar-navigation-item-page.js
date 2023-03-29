/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexBlock,
	Button,
} from '@wordpress/components';
import { info } from '@wordpress/icons';

export default function SidebarNavigationItemPage( {
	className,
	children,
	onInfoClick,
	previewLinkInfo,
	status,
	modified,
	...props
} ) {
	return (
		<Item
			className={ classnames(
				'edit-site-sidebar-navigation-item edit-site-sidebar-navigation-item-page',
				className
			) }
			{ ...previewLinkInfo }
			{ ...props }
		>
			<HStack justify="flex-start" spacing={ 3 }>
				<div
					className={ `edit-site-sidebar-navigation-item__status ${ status }` }
				></div>
				<FlexBlock>
					<VStack spacing={ 1 }>
						<FlexBlock>{ children }</FlexBlock>
						<p className="edit-site-sidebar-navigation-item__text">
							Updated { getRelativeTimeString( modified ) }
						</p>
					</VStack>
				</FlexBlock>
				<Button
					icon={ info }
					onClick={ onInfoClick }
					label="view page information"
				/>
			</HStack>
		</Item>
	);
}

export function getRelativeTimeString( date, lang = 'en' ) {
	// Allow dates or times to be passed
	const timeMs = typeof date === 'number' ? date : date.getTime();

	// Get the amount of seconds between the given date and now
	const deltaSeconds = Math.round( ( timeMs - Date.now() ) / 1000 );

	// Array reprsenting one minute, hour, day, week, month, etc in seconds
	const cutoffs = [
		60,
		3600,
		86400,
		86400 * 7,
		86400 * 30,
		86400 * 365,
		Infinity,
	];

	// Array equivalent to the above but in the string representation of the units
	const units = [
		'second',
		'minute',
		'hour',
		'day',
		'week',
		'month',
		'year',
	];

	// Grab the ideal cutoff unit
	const unitIndex = cutoffs.findIndex(
		( cutoff ) => cutoff > Math.abs( deltaSeconds )
	);

	// Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
	// is one day in seconds, so we can divide our seconds by this to get the # of days
	const divisor = unitIndex ? cutoffs[ unitIndex - 1 ] : 1;

	// Intl.RelativeTimeFormat do its magic
	const rtf = new Intl.RelativeTimeFormat( lang, { numeric: 'auto' } );
	return rtf.format(
		Math.floor( deltaSeconds / divisor ),
		units[ unitIndex ]
	);
}
