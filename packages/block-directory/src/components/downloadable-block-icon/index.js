/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';

function DownloadableBlockIcon( { icon } ) {
	const className = 'block-directory-downloadable-block-icon';
	return icon.match( /\.(jpeg|jpg|gif|png|svg)(?:\?.*)?$/ ) !== null ? (
		<img className={ className } src={ icon } alt="" />
	) : (
		<BlockIcon className={ className } icon={ icon } showColors />
	);
}

export default DownloadableBlockIcon;
