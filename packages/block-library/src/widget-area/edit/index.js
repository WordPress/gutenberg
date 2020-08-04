/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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
	const index = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockIndex( clientId ),
		[ clientId ]
	);
	return (
		<Panel className={ className }>
			<PanelBody title={ name } initialOpen={ index === 0 }>
				<EntityProvider kind="root" type="widgetArea" id={ id }>
					<WidgetAreaInnerBlocks />
				</EntityProvider>
			</PanelBody>
		</Panel>
	);
}
