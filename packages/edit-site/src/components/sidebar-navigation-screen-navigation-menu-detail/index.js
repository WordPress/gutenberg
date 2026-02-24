/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';
import {
	Spinner,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';

const POST_TYPE = 'wp_navigation';

function countMenuItems( rawContent ) {
	if ( ! rawContent ) {
		return 0;
	}
	const matches = rawContent.match(
		/<!-- wp:navigation-link|<!-- wp:navigation-submenu/g
	);
	return matches ? matches.length : 0;
}

function MenuDetails( { navigationMenu } ) {
	const status = navigationMenu?.status;
	const modified = navigationMenu?.modified;
	const rawContent = navigationMenu?.content?.raw;

	const itemCount = useMemo(
		() => countMenuItems( rawContent ),
		[ rawContent ]
	);

	const dateSettings = getDateSettings();
	const formattedDate = modified
		? dateI18n( dateSettings.formats.date, modified )
		: '—';

	const statusLabel =
		status === 'publish' ? __( 'Published' ) : __( 'Draft' );

	return (
		<VStack spacing={ 3 }>
			<HStack alignment="left" spacing={ 2 }>
				<Text
					as="span"
					color="#a7aaad"
					size="12px"
					upperCase
					weight={ 500 }
				>
					{ __( 'Status' ) }
				</Text>
				<Text as="span" size="12px" weight={ 600 }>
					{ statusLabel }
				</Text>
			</HStack>
			<HStack alignment="left" spacing={ 2 }>
				<Text
					as="span"
					color="#a7aaad"
					size="12px"
					upperCase
					weight={ 500 }
				>
					{ __( 'Last modified' ) }
				</Text>
				<Text as="span" size="12px">
					{ formattedDate }
				</Text>
			</HStack>
			<HStack alignment="left" spacing={ 2 }>
				<Text
					as="span"
					color="#a7aaad"
					size="12px"
					upperCase
					weight={ 500 }
				>
					{ __( 'Menu items' ) }
				</Text>
				<Text as="span" size="12px">
					{ sprintf(
						/* translators: %d: number of menu items */
						__( '%d items' ),
						itemCount
					) }
				</Text>
			</HStack>
		</VStack>
	);
}

export default function SidebarNavigationScreenNavigationMenuDetail( {
	postId,
	backPath = '/navigation',
} ) {
	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		POST_TYPE,
		postId
	);

	if ( isResolving && ! navigationMenu ) {
		return (
			<SidebarNavigationScreen
				title={ __( 'Navigation' ) }
				backPath={ backPath }
				content={ <Spinner /> }
			/>
		);
	}

	const title = buildNavigationLabel(
		navigationMenu?.title,
		navigationMenu?.id,
		navigationMenu?.status
	);

	return (
		<SidebarNavigationScreen
			title={ title || __( 'Navigation' ) }
			backPath={ backPath }
			description={ __(
				'Template parts where this menu is used. Click to edit in context.'
			) }
			content={ <MenuDetails navigationMenu={ navigationMenu } /> }
		/>
	);
}
