import type { ReactElement } from 'react';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { symbolFilled } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useTemplatePartTitle } from '../sidebar-navigation-screen-site-parts';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

const { useLocation } = unlock( routerPrivateApis );
const EMPTY_ARRAY: string[] = [];
const { getSitePartArea, getSitePartPanels, useSitePart, useUsedOnLabel } =
	unlock( editorPrivateApis );

type PartInUse = { id: string; templates: string[] };
type PanelItem = { panel: string; label: string; icon: ReactElement };

function OtherPartItem( { part }: { part: PartInUse } ) {
	const title = useTemplatePartTitle( part.id );
	return (
		<SidebarNavigationItem
			to={ `/${ TEMPLATE_PART_POST_TYPE }/${ part.id }` }
			withChevron
		>
			{ title }
		</SidebarNavigationItem>
	);
}

export default function SidebarNavigationScreenSitePart() {
	const {
		params: { area },
		query,
	} = useLocation();
	const areaDetails = getSitePartArea( area );
	const { partId, partsInUse, contents } = useSitePart( area );
	const title = useTemplatePartTitle( partId );
	const primaryTemplates =
		partsInUse.find( ( part: PartInUse ) => part.id === partId )
			?.templates ?? EMPTY_ARRAY;
	const usedOn = useUsedOnLabel( primaryTemplates );

	if ( ! areaDetails ) {
		return null;
	}

	const panels: PanelItem[] = partId ? getSitePartPanels( contents ) : [];
	const otherParts = partsInUse.filter(
		( part: PartInUse ) => part.id !== partId
	);
	const allPartsPath = `/pattern?postType=${ TEMPLATE_PART_POST_TYPE }&categoryId=${ area }`;

	const description = partId
		? sprintf(
				/* translators: 1: Template part title. 2: Where it is used, e.g. "Used on Index, Pages". */
				__( '%1$s · %2$s' ),
				title,
				usedOn
			)
		: areaDetails.missingLabel;

	return (
		<SidebarNavigationScreen
			title={ areaDetails.label }
			description={ description }
			backPath="/site-parts"
			content={
				<>
					{ panels.length > 0 && (
						<ItemGroup className="edit-site-sidebar-navigation-screen-site-parts__list">
							{ panels.map( ( item ) => (
								<SidebarNavigationItem
									key={ item.panel }
									icon={ item.icon }
									to={ `/site-parts/${ area }?panel=${ item.panel }` }
									aria-current={
										query?.panel === item.panel
											? 'true'
											: undefined
									}
								>
									{ item.label }
								</SidebarNavigationItem>
							) ) }
						</ItemGroup>
					) }
					{ panels.length > 0 && (
						<hr className="edit-site-sidebar-navigation-screen-site-part__divider" />
					) }
					{ otherParts.length > 0 && (
						<div className="edit-site-sidebar-navigation-screen-site-part__section">
							<h2 className="edit-site-sidebar-navigation-screen-site-part__heading">
								{ areaDetails.inUseLabel }
							</h2>
							<ItemGroup className="edit-site-sidebar-navigation-screen-site-parts__list">
								{ otherParts.map( ( part: PartInUse ) => (
									<OtherPartItem
										key={ part.id }
										part={ part }
									/>
								) ) }
							</ItemGroup>
						</div>
					) }
					<div className="edit-site-sidebar-navigation-screen-site-part__section">
						<ItemGroup className="edit-site-sidebar-navigation-screen-site-parts__list">
							<SidebarNavigationItem
								to={ allPartsPath }
								icon={ symbolFilled }
								withChevron
							>
								{ areaDetails.allLabel }
							</SidebarNavigationItem>
						</ItemGroup>
					</div>
				</>
			}
		/>
	);
}
