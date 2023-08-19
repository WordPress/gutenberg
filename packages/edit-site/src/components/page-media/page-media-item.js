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
	return (
		<Page
			className="edit-site-media-page-media-item"
			title={ __( 'Media item name here' ) }
			hideTitleFromUI
		>
			<Spacer padding={ 3 }>
				<VStack spacing={ 3 }>
					<h1>{ record?.title.rendered }</h1>
				</VStack>
			</Spacer>
		</Page>
	);
}
