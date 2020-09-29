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
				// This workaround is required to ensure LegacyWidget blocks are not unmounted when the panel is collapsed.
				// Unmounting legacy widgets may have unintended consequences (e.g. TinyMCE not being properly reinitialized)
				opened={ true }
				onToggle={ () => {
					setIsWidgetAreaOpen( clientId, ! isOpen );
				} }
				className={ isOpen ? 'widget-area-is-opened' : '' }
			>
				<EntityProvider
					kind="root"
					type="postType"
					id={ `widget-area-${ id }` }
				>
					<InnerBlocksContainer isOpen={ isOpen } />
				</EntityProvider>
			</PanelBody>
		</Panel>
	);
}

function InnerBlocksContainer( { isOpen } ) {
	const props = isOpen
		? {}
		: {
				hidden: true,
				'aria-hidden': true,
				style: { display: 'none' },
		  };
	return (
		<div { ...props }>
			<WidgetAreaInnerBlocks />
		</div>
	);
}
