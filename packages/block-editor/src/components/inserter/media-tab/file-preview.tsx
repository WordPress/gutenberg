import { Icon as WCIcon } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { audio, file } from '@wordpress/icons';
import { getFilename } from '@wordpress/url';

const PREVIEW_ICONS: Record< string, React.JSX.Element > = {
	audio,
};

/**
 * An icon and a filename, for media with no visual preview of its own.
 */
export default function FilePreview( {
	url,
	mediaType,
}: {
	url: string;
	mediaType: string;
} ) {
	// A URL doesn't always include a filename, in which case the icon renders on its own.
	const filename = getFilename( url );
	return (
		<Stack
			direction="column"
			align="center"
			justify="center"
			className="block-editor-inserter__media-grid__file-preview"
		>
			<WCIcon icon={ PREVIEW_ICONS[ mediaType ] ?? file } size={ 24 } />
			{ !! filename && (
				<span className="block-editor-inserter__media-grid__file-preview__name">
					{ filename }
				</span>
			) }
		</Stack>
	);
}
