/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { EntityProvider } from '@wordpress/core-data';
import { Panel, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';

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
				opened={ true }
				onToggle={ ( opened ) => {
					setIsWidgetAreaOpen( clientId, opened );
				} }
				className={ isOpen ? 'widget-area-is-opened' : '' }
			>
				<EntityProvider
					kind="root"
					type="postType"
					id={ `widget-area-${ id }` }
				>
					<InnerBlocksContainer isOpened={ isOpened } />
				</EntityProvider>
			</PanelBody>
		</Panel>
	);
}

function InnerBlocksContainer( { isOpened } ) {
	const props = isOpened
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
