/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatePreview from '../template-preview';
import NavigationItemWithIcon from '../navigation-item-with-icon';

export default function TemplatePartsMenu( {
	activeId,
	onActiveTemplatePartIdChange,
} ) {
	const [ hoveredTemplatePartId, setHoveredTemplatePartId ] = useState();

	const onMouseEnterTemplatePart = ( id ) => setHoveredTemplatePartId( id );
	const onMouseLeaveTemplatePart = () => setHoveredTemplatePartId( null );

	const templateParts = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords } = select( 'core' );

			const currentTemplate = getEntityRecord(
				'postType',
				'wp_template',
				activeId
			);

			return currentTemplate
				? getEntityRecords( 'postType', 'wp_template_part', {
						resolved: true,
						template: currentTemplate.slug,
				  } )
				: null;
		},
		[ activeId ]
	);

	return (
		<NavigationMenu
			menu="template-parts"
			title="Template Parts"
			parentMenu="root"
		>
			{ templateParts?.map( ( templatePart ) => {
				const key = `template-part-${ templatePart.id }`;

				return (
					<NavigationItemWithIcon
						key={ key }
						item={ key }
						title={ templatePart.slug }
						template={ templatePart }
						onClick={ () =>
							onActiveTemplatePartIdChange( templatePart.id )
						}
						onMouseEnter={ () =>
							onMouseEnterTemplatePart( templatePart.id )
						}
						onMouseLeave={ onMouseLeaveTemplatePart }
					/>
				);
			} ) }

			{ ( ! templateParts || templateParts.length === 0 ) && (
				<NavigationItem title={ __( 'Loading…' ) } />
			) }

			{ hoveredTemplatePartId && (
				<TemplatePreview entityId={ hoveredTemplatePartId } />
			) }
		</NavigationMenu>
	);
}
