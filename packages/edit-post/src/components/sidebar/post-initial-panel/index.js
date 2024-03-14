/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect } from '@wordpress/data';
import { page as pageIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { PostSidebarCard } = unlock( editorPrivateApis );

export default function PostInitialSidebar() {
	const { modified, title } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		return {
			title: getEditedPostAttribute( 'title' ),
			modified: getEditedPostAttribute( 'modified' ),
		};
	} );
	return (
		<PanelBody>
			<PostSidebarCard
				title={ decodeEntities( title ) }
				icon={ pageIcon }
				description={
					<VStack>
						<Text>
							{ sprintf(
								// translators: %s: Human-readable time difference, e.g. "2 days ago".
								__( 'Last edited %s' ),
								humanTimeDiff( modified )
							) }
						</Text>
					</VStack>
				}
			/>
		</PanelBody>
	);
}
