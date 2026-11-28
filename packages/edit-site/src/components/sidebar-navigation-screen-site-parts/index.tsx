import type { ReactElement } from 'react';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

const { getSitePartAreas, useSitePartsUsage } = unlock( editorPrivateApis );

export function useTemplatePartTitle( partId: string | null ): string {
	return useSelect(
		( select ) => {
			if ( ! partId ) {
				return '';
			}
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				TEMPLATE_PART_POST_TYPE,
				partId
			) as { title?: string | { rendered?: string } } | undefined;
			const title =
				typeof record?.title === 'string'
					? record.title
					: record?.title?.rendered;
			return decodeEntities( title ?? '' ) || __( '(no title)' );
		},
		[ partId ]
	);
}

export default function SidebarNavigationScreenSiteParts() {
	const usage = useSitePartsUsage();
	const items = (
		getSitePartAreas() as Array< {
			area: string;
			label: string;
			icon: ReactElement;
		} >
	 ).filter( ( { area } ) => !! usage?.primary[ area ] );

	let content = null;
	if ( usage && ! items.length ) {
		content = (
			<>
				<p className="edit-site-sidebar-navigation-screen-site-parts__empty">
					{ __( 'Your homepage doesn’t use any site parts yet.' ) }
				</p>
				<ItemGroup className="edit-site-sidebar-navigation-screen-site-parts__list">
					<SidebarNavigationItem
						to={ `/pattern?postType=${ TEMPLATE_PART_POST_TYPE }` }
						withChevron
					>
						{ __( 'See all template parts' ) }
					</SidebarNavigationItem>
				</ItemGroup>
			</>
		);
	} else if ( items.length ) {
		content = (
			<ItemGroup className="edit-site-sidebar-navigation-screen-site-parts__list">
				{ items.map( ( { area, label, icon } ) => (
					<SidebarNavigationItem
						key={ area }
						icon={ icon }
						to={ `/site-parts/${ area }` }
						withChevron
					>
						{ label }
					</SidebarNavigationItem>
				) ) }
			</ItemGroup>
		);
	}

	return (
		<SidebarNavigationScreen
			title={ __( 'Site parts' ) }
			description={ __(
				'The parts that appear on every page of your site, like the header at the top and the footer at the bottom.'
			) }
			backPath="/"
			content={ content }
		/>
	);
}
