/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getQueryArgs } from '@wordpress/url';
import {
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Page from '../page';

function getMediaPreview( mediaType, record ) {
	if ( mediaType === 'image' ) {
		return <img src={ record?.source_url } alt={ record?.alt_text } />;
	}

	if ( mediaType === 'audio' ) {
		return (
			<audio
				controls="controls"
				src={ record?.source_url }
				autoPlay={ false }
				preload="true"
			/>
		);
	}

	if ( mediaType === 'video' ) {
		return (
			<video
				controls="controls"
				poster={ record?.poster }
				preload="true"
				src={ record?.source_url }
			/>
		);
	}
}

export function getMediaTypeFromMimeType( mimeType ) {
	// @todo this needs to be abstracted and the
	//  media types formalized somewhere.
	if ( mimeType.startsWith( 'image/' ) ) {
		return 'image';
	}

	if ( mimeType.startsWith( 'video/' ) ) {
		return 'video';
	}

	if ( mimeType.startsWith( 'audio/' ) ) {
		return 'audio';
	}

	if ( mimeType.startsWith( 'application/' ) ) {
		return 'application';
	}
}

export default function PageMediaItem() {
	const { postId } = getQueryArgs( window.location.href );
	const { record } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			return {
				record: getMedia( postId ),
			};
		},
		[ postId ]
	);

	const mediaType = record?.mime_type
		? getMediaTypeFromMimeType( record.mime_type )
		: undefined;

	return (
		<Page title={ __( 'Media item name here' ) } hideTitleFromUI>
			<Spacer
				padding={ 3 }
				className="edit-site-media-page-media-item__spacer"
			>
				<VStack
					spacing={ 3 }
					className="edit-site-media-page-media-item"
				>
					{ mediaType &&
						record &&
						getMediaPreview( mediaType, record ) }
				</VStack>
			</Spacer>
		</Page>
	);
}
