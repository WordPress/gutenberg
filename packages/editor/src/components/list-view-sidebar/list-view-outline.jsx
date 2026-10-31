import { __experimentalText as WCText } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import CharacterCount from '../character-count';
import WordCount from '../word-count';
import TimeToRead from '../time-to-read';
import DocumentOutline from '../document-outline';

export default function ListViewOutline() {
	const { headingCount, paragraphCount, numberOfBlocks } = useSelect(
		( select ) => {
			const { getGlobalBlockCount } = select( blockEditorStore );
			return {
				headingCount: getGlobalBlockCount( 'core/heading' ),
				paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
				numberOfBlocks: getGlobalBlockCount(),
			};
		},
		[]
	);
	return (
		<>
			<div className="editor-list-view-sidebar__outline">
				<div>
					<WCText>{ __( 'Characters:' ) }</WCText>
					<WCText>
						<CharacterCount />
					</WCText>
				</div>
				<div>
					<WCText>{ __( 'Words:' ) }</WCText>
					<WordCount />
				</div>
				<div>
					<WCText>{ __( 'Time to read:' ) }</WCText>
					<TimeToRead />
				</div>
				<div>
					<WCText>{ __( 'Headings:' ) }</WCText>
					<WCText>{ headingCount }</WCText>
				</div>
				<div>
					<WCText>{ __( 'Paragraphs:' ) }</WCText>
					<WCText>{ paragraphCount }</WCText>
				</div>
				<div>
					<WCText>{ __( 'Blocks:' ) }</WCText>
					<WCText>{ numberOfBlocks }</WCText>
				</div>
			</div>
			<DocumentOutline />
		</>
	);
}
