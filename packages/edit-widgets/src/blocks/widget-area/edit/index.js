/**
 * External dependencies
 */
import { DisclosureContent } from 'reakit/Disclosure';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
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
	const { isOpen, isDraggingBlocks } = useSelect(
		( select ) => ( {
			isOpen: select( 'core/edit-widgets' ).getIsWidgetAreaOpen(
				clientId
			),
			isDraggingBlocks: select( 'core/block-editor' ).isDraggingBlocks(),
		} ),
		[ clientId ]
	);
	const { setIsWidgetAreaOpen } = useDispatch( 'core/edit-widgets' );
	const openOnDragOver = useCallback( () => {
		if ( ! isOpen && isDraggingBlocks ) {
			setIsWidgetAreaOpen( clientId, true );
		}
	}, [ clientId, isOpen, setIsWidgetAreaOpen, isDraggingBlocks ] );

	return (
		<div onDragOver={ openOnDragOver }>
			<Panel className={ className }>
				<PanelBody
					title={ name }
					opened={ isOpen }
					onToggle={ () => {
						setIsWidgetAreaOpen( clientId, ! isOpen );
					} }
				>
					{ ( { opened } ) => (
						// This is required to ensure LegacyWidget blocks are not unmounted when the panel is collapsed.
						// Unmounting legacy widgets may have unintended consequences (e.g. TinyMCE not being properly reinitialized)
						<DisclosureContent visible={ opened }>
							<EntityProvider
								kind="root"
								type="postType"
								id={ `widget-area-${ id }` }
							>
								<WidgetAreaInnerBlocks />
							</EntityProvider>
						</DisclosureContent>
					) }
				</PanelBody>
			</Panel>
		</div>
	);
}
