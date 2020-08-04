/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Panel, PanelBody } from '@wordpress/components';
import { InnerBlocks } from '@wordpress/block-editor';

export default function WidgetAreaEdit( {
	clientId,
	className,
	attributes: { name },
} ) {
	const index = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockIndex( clientId ),
		[ clientId ]
	);
	return (
		<Panel className={ className }>
			<PanelBody title={ name } initialOpen={ index === 0 }>
				<InnerBlocks
					templateLock={ false }
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</PanelBody>
		</Panel>
	);
}
