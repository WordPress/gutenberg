/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { CharacterCount, WordCount, TimeToRead } from '@wordpress/editor';

export default function ListViewInfo() {
	const { headingCount, paragraphCount, blockCount } = useSelect(
		( select ) => {
			const { getGlobalBlockCount } = select( blockEditorStore );
			return {
				headingCount: getGlobalBlockCount( 'core/heading' ),
				paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
				blockCount: getGlobalBlockCount(),
			};
		}
	);
	const instanceId = useInstanceId(
		ListViewInfo,
		'edit-post-editor-list-view-overview-info'
	);
	return (
		<div className="edit-post-editor__list-view-overview__container">
			<p className="screen-reader-text" id={ instanceId }>
				{ __( 'Document info' ) }
			</p>
			<ul
				className="edit-post-editor__list-view-overview"
				aria-describedby={ instanceId }
			>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Characters' ) }&nbsp;</Text>
					<Text size={ 16 }>
						<CharacterCount />
					</Text>
				</li>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Words' ) }&nbsp;</Text>
					<Text size={ 16 }>
						<WordCount />
					</Text>
				</li>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Paragraphs' ) }&nbsp;</Text>
					<Text size={ 16 }>{ paragraphCount }</Text>
				</li>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Headings' ) }&nbsp;</Text>
					<Text size={ 16 }>{ headingCount }</Text>
				</li>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Time to read' ) }&nbsp;</Text>
					<Text size={ 16 }>
						<TimeToRead />
					</Text>
				</li>
				<li className="edit-post-editor__list-view-overview__item">
					<Text variant="muted">{ __( 'Blocks' ) }&nbsp;</Text>
					<Text size={ 16 }>{ blockCount }</Text>
				</li>
			</ul>
		</div>
	);
}
