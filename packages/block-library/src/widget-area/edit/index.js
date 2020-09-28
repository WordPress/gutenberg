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
	const { index, isOpen } = useSelect(
		( select ) => {
			const blockIndex = select( 'core/block-editor' ).getBlockIndex(
				clientId
			);

			return {
				index: blockIndex,
				isOpen: select( 'core/edit-widgets' ).getIsWidgetAreaOpen(
					blockIndex
				),
			};
		},
		[ clientId ]
	);
	const { setIsWidgetAreaOpen } = useDispatch( 'core/edit-widgets' );

	return (
		<Panel className={ className }>
			<PanelBody
				title={ name }
				opened={ isOpen }
				onToggle={ ( opened ) => {
					setIsWidgetAreaOpen( index, opened );
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
