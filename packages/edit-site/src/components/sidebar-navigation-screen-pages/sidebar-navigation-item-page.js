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
} from '@wordpress/components';
import { Icon, page as pageIcon } from '@wordpress/icons';

export default function SidebarNavigationItemPage( {
	className,
	children,
	onHover,
	linkInfo,
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
			{ ...linkInfo }
			{ ...props }
			onMouseEnter={ onHover }
		>
			<HStack justify="flex-start" spacing={ 2 }>
				<Icon
					className="edit-site-sidebar-navigation-item__icon"
					icon={ pageIcon }
				/>
				<FlexBlock>
					<VStack spacing={ 1 }>
						<FlexBlock>{ children }</FlexBlock>
					</VStack>
				</FlexBlock>
				<div
					className={ `edit-site-sidebar-navigation-item__status ${ status }` }
				></div>
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
