import { Icon as WCIcon } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { audio, file } from '@wordpress/icons';
import { getFilename } from '@wordpress/url';
import type { MediaType } from './types';

// Icons for media that has no preview of its own. Audio is the only such type
// the inserter can show today; the default covers types added later, such as
// documents.
const PREVIEW_ICONS: Partial< Record< MediaType, React.JSX.Element > > = {
	audio,
};

/**
 * Stands in for media with nothing to show: the type's icon above the file's
 * name, in place of an empty tile or a player squeezed into one.
 */
export default function FilePreview( {
	url,
	mediaType,
}: {
	url: string;
	mediaType: MediaType;
} ) {
	// External sources can hand us a URL with no filename in it, in which case
	// the icon stands alone.
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
