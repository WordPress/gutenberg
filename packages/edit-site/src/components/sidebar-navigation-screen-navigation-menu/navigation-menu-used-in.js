/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Spinner,
} from '@wordpress/components';
import { getTemplatePartIcon } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationMenuUsedIn from './use-navigation-menu-used-in';
import SidebarNavigationItem from '../sidebar-navigation-item';

function AreaLabel( { area, templatePartAreas } ) {
	const match = templatePartAreas.find( ( item ) => item.area === area );
	return match?.label || area;
}

export default function NavigationMenuUsedIn( { navigationMenuId } ) {
	const { templateParts, isResolving } =
		useNavigationMenuUsedIn( navigationMenuId );

	const templatePartAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas || [],
		[]
	);

	if ( isResolving ) {
		return <Spinner />;
	}

	if ( ! templateParts.length ) {
		return (
			<VStack spacing={ 3 }>
				<Heading level={ 5 }>
					{ sprintf(
						/* translators: %d: number of template parts */
						__( 'Used in %d template part(s)' ),
						0
					) }
				</Heading>
			</VStack>
		);
	}

	return (
		<VStack spacing={ 3 }>
			<Heading level={ 5 }>
				{ sprintf(
					/* translators: %d: number of template parts */
					__( 'Used in %d template part(s)' ),
					templateParts.length
				) }
			</Heading>
			<ItemGroup>
				{ templateParts.map( ( templatePart ) => (
					<SidebarNavigationItem
						key={ templatePart.id }
						uid={ `template-part-${ String(
							templatePart.id
						).replace( /\//g, '-' ) }` }
						icon={ getTemplatePartIcon(
							templatePart.area || 'uncategorized'
						) }
						to={ addQueryArgs(
							`/wp_template_part/${ templatePart.id }`,
							{
								canvas: 'edit',
								focusNavigationBlock: navigationMenuId,
							}
						) }
					>
						{ templatePart.title?.rendered ||
							templatePart.slug ||
							templatePart.id }
						<Text variant="muted" size="body" as="span">
							{ ' — ' }
							<AreaLabel
								area={ templatePart.area }
								templatePartAreas={ templatePartAreas }
							/>
						</Text>
					</SidebarNavigationItem>
				) ) }
			</ItemGroup>
		</VStack>
	);
}
