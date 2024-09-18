/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

export default function PreviewBlockPopover( { blocks } ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	if ( isMobile ) {
		return null;
	}

	return (
		<div className="block-editor-block-switcher__popover-preview-container">
			<Popover
				className="block-editor-block-switcher__popover-preview"
				placement="right-start"
				focusOnMount={ false }
				offset={ 16 }
			>
				<div className="block-editor-block-switcher__preview">
					<div className="block-editor-block-switcher__preview-title">
						{ __( 'Preview' ) }
					</div>
					<BlockPreview viewportWidth={ 500 } blocks={ blocks } />
				</div>
			</Popover>
		</div>
	);
}
