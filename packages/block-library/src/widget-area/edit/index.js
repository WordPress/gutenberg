/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { EntityProvider } from '@wordpress/core-data';
import { Panel, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WidgetAreaInnerBlocks from './inner-blocks';

export default function WidgetAreaEdit( {
	clientId,
	className,
	attributes: { id, name },
} ) {
	const isOpen = useSelect(
		( select ) =>
			select( 'core/edit-widgets' ).getIsWidgetAreaOpen( clientId ),
		[ clientId ]
	);
	const { setIsWidgetAreaOpen } = useDispatch( 'core/edit-widgets' );

	return (
		<Panel className={ className }>
			<PanelBody
				title={ name }
				opened={ isOpen }
				onToggle={ ( opened ) => {
					setIsWidgetAreaOpen( clientId, opened );
				} }
			>
				<EntityProvider
					kind="root"
					type="postType"
					id={ `widget-area-${ id }` }
				>
					<WidgetAreaInnerBlocks />
				</EntityProvider>
			</PanelBody>
		</Panel>
	);
}
