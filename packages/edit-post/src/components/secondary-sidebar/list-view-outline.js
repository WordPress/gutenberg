/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	DocumentOutline,
	WordCount,
	TimeToRead,
	CharacterCount,
} from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EmptyOutlineIlutration from './empty-outline-ilustration';

export default function ListViewOutline() {
	const { headingCount } = useSelect( ( select ) => {
		const { getGlobalBlockCount } = select( blockEditorStore );
		return {
			headingCount: getGlobalBlockCount( 'core/heading' ),
		};
	}, [] );
	return (
		<>
			{ headingCount > 0 ? (
				<DocumentOutline />
			) : (
				<div className="edit-post-editor__list-view-empty-headings">
					<EmptyOutlineIlutration />
					<p>
						{ __(
							'Navigate the structure of your document and address issues like empty or incorrect heading levels.'
						) }
					</p>
				</div>
			) }
			<div className="edit-post-editor__list-view-overview">
				<div>
					<Text>{ __( 'Characters:' ) }</Text>
					<Text>
						<CharacterCount />
					</Text>
				</div>
				<div>
					<Text>{ __( 'Words:' ) }</Text>
					<WordCount />
				</div>
				<div>
					<Text>{ __( 'Time to read:' ) }</Text>
					<TimeToRead />
				</div>
			</div>
		</>
	);
}
