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

export default function TemplatePartsMenu( { onActiveTemplatePartIdChange } ) {
	const [ hoveredTemplatePartId, setHoveredTemplatePartId ] = useState();

	const onMouseEnterTemplatePart = ( id ) => setHoveredTemplatePartId( id );
	const onMouseLeaveTemplatePart = () => setHoveredTemplatePartId( null );

	const templateParts = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template_part' ),
		[]
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
					<NavigationItem
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

			{ ! templateParts && <NavigationItem title={ __( 'Loading…' ) } /> }

			{ hoveredTemplatePartId && (
				<TemplatePreview entityId={ hoveredTemplatePartId } />
			) }
		</NavigationMenu>
	);
}
