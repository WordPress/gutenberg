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
	__experimentalHeading as Heading,
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

export default function PageMediaItem() {
	const { postId, mediaType } = getQueryArgs( window.location.href );
	const { record } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			return {
				record: getMedia( postId ),
			};
		},
		[ postId ]
	);
	return (
		<Page
			className="edit-site-media-page-media-item"
			title={ __( 'Media item name here' ) }
			hideTitleFromUI
		>
			<Spacer padding={ 3 }>
				<VStack spacing={ 3 }>
					<Heading level={ 1 }>{ record?.title.raw }</Heading>
					{ getMediaPreview( mediaType, record ) }
				</VStack>
			</Spacer>
		</Page>
	);
}
