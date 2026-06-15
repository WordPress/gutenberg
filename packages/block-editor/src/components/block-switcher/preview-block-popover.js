/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

export default function PreviewBlockPopover( {
	blocks,
	placement = 'right-start',
	offset = 16,
	anchor,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	if ( isMobile ) {
		return null;
	}

	return (
		<div className="block-editor-block-switcher__popover-preview-container">
			<Popover
				className="block-editor-block-switcher__popover-preview"
				placement={ placement }
				focusOnMount={ false }
				offset={ offset }
				anchor={ anchor }
			>
				<div className="block-editor-block-switcher__preview">
					{ /* 600px is the value of $break-small in base-styles/_breakpoints.scss.
						We set the viewport width to 601px to make sure that the media-text 
						block which uses this breakpoint has the correct padding. */ }
					<BlockPreview viewportWidth={ 601 } blocks={ blocks } />
				</div>
			</Popover>
		</div>
	);
}
