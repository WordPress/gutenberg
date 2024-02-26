/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalTruncate as Truncate,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

function TemplateAreaButton( { postId, area, title } ) {
	const templatePartArea = useSelect(
		( select ) => {
			const defaultAreas =
				select(
					editorStore
				).__experimentalGetDefaultTemplatePartAreas();

			return defaultAreas.find(
				( defaultArea ) => defaultArea.area === area
			);
		},
		[ area ]
	);
	const linkInfo = useLink( {
		postType: TEMPLATE_PART_POST_TYPE,
		postId,
	} );

	return (
		<SidebarNavigationItem
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			{ ...linkInfo }
			icon={ templatePartArea?.icon }
			withChevron
		>
			<Truncate
				limit={ 20 }
				ellipsizeMode="tail"
				numberOfLines={ 1 }
				className="edit-site-sidebar-navigation-screen-template__template-area-label-text"
			>
				{ decodeEntities( title ) }
			</Truncate>
		</SidebarNavigationItem>
	);
}

export default function TemplateAreas() {
	const { templatePartAreas, currentTemplateParts } = useSelect(
		( select ) => {
			const { getSettings, getCurrentTemplateTemplateParts } = unlock(
				select( editSiteStore )
			);
			return {
				templatePartAreas: getSettings()?.defaultTemplatePartAreas,
				currentTemplateParts: getCurrentTemplateTemplateParts(),
			};
		},
		[]
	);

	/*
	 * Merge data in currentTemplateParts with templatePartAreas,
	 * which contains the template icon and fallback labels
	 */
	const templateAreas = useMemo( () => {
		// Keep track of template part IDs that have already been added to the array.
		const templatePartIds = new Set();
		const filterOutDuplicateTemplateParts = ( currentTemplatePart ) => {
			// If the template part has already been added to the array, skip it.
			if ( templatePartIds.has( currentTemplatePart.templatePart.id ) ) {
				return;
			}
			// Add to the array of template part IDs.
			templatePartIds.add( currentTemplatePart.templatePart.id );
			return currentTemplatePart;
		};

		return currentTemplateParts.length && templatePartAreas
			? currentTemplateParts
					.filter( filterOutDuplicateTemplateParts )
					.map( ( { templatePart, block } ) => ( {
						...templatePartAreas?.find(
							( { area } ) => area === templatePart?.area
						),
						...templatePart,
						clientId: block.clientId,
					} ) )
			: [];
	}, [ currentTemplateParts, templatePartAreas ] );

	if ( ! templateAreas.length ) {
		return null;
	}

	return (
		<SidebarNavigationScreenDetailsPanel
			title={ __( 'Areas' ) }
			spacing={ 3 }
		>
			<ItemGroup>
				{ templateAreas.map(
					( { clientId, label, area, theme, slug, title } ) => (
						<SidebarNavigationScreenDetailsPanelRow
							key={ clientId }
						>
							<TemplateAreaButton
								postId={ `${ theme }//${ slug }` }
								title={ title?.rendered || label }
								area={ area }
							/>
						</SidebarNavigationScreenDetailsPanelRow>
					)
				) }
			</ItemGroup>
		</SidebarNavigationScreenDetailsPanel>
	);
}
