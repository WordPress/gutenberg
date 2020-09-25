/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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
	const index = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockIndex( clientId ),
		[ clientId ]
	);

	const [ isOpened, setIsOpened ] = useState( index === 0 );

	const toggleChildren = () => {
		setIsOpened( ! isOpened );
	};

	return (
		<Panel className={ className }>
			<PanelBody
				title={ name }
				onToggle={ toggleChildren }
				opened={ true }
				className={ isOpened ? 'widget-area-is-opened' : '' }
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
