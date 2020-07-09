/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BlockIcon } from '@wordpress/block-editor';

function DownloadableBlockIcon( { icon, title } ) {
	return (
		<div className="block-directory-downloadable-block-icon">
			{ icon.match( /\.(jpeg|jpg|gif|png|svg)(?:\?.*)?$/ ) !== null ? (
				<img
					src={ icon }
					alt={ sprintf(
						// translators: %s: Name of the plugin e.g: "Akismet".
						__( '%s block icon' ),
						title
					) }
				/>
			) : (
				<BlockIcon icon={ icon } showColors />
			) }
		</div>
	);
}

export default DownloadableBlockIcon;
