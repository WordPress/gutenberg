/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function WidgetAreas() {
	const blocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks(),
		[]
	);

	const hasWidgetAreas = blocks.length > 0;

	return (
		<div className="edit-widgets-widget-areas">
			<div className="edit-widgets-widget-areas__top-container">
				<BlockIcon icon={ blockDefault } />
				<div>
					<p>
						{ __(
							"Widget Areas are global parts in your site's layout that can accept blocks. These vary by theme, but are typically parts like your Sidebar or Footer."
						) }
					</p>
					{ ! hasWidgetAreas && (
						<p>
							{ __(
								'Your theme does not contain any Widget Areas.'
							) }
						</p>
					) }
				</div>
			</div>
		</div>
	);
}
