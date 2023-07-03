/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

export default function PreviewBlockPopover( { blocks } ) {
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					placement="bottom-start"
					focusOnMount={ false }
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPreview viewportWidth={ 500 } blocks={ blocks } />
					</div>
				</Popover>
			</div>
		</div>
	);
}
