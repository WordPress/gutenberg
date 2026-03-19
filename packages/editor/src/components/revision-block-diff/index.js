/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

/**
 * Panel that shows changed block attributes for the selected block
 * when viewing revisions.
 */
export default function RevisionBlockDiffPanel() {
	const { block } = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		return {
			block: getSelectedBlock(),
		};
	}, [] );

	if ( ! block ) {
		return null;
	}

	const diffInfo = block.attributes?.__revisionDiffStatus;
	const changedAttributes = diffInfo?.changedAttributes;

	if ( ! changedAttributes ) {
		return null;
	}

	const fields = Object.entries( changedAttributes ).map(
		( [ key, parts ] ) => (
			<PostPanelRow key={ key } label={ key }>
				<span className="editor-revision-fields-diff__value">
					{ parts.map( ( part, index ) => {
						if ( part.added ) {
							return (
								<ins
									key={ index }
									className="editor-revision-fields-diff__added"
								>
									{ part.value }
								</ins>
							);
						}
						if ( part.removed ) {
							return (
								<del
									key={ index }
									className="editor-revision-fields-diff__removed"
								>
									{ part.value }
								</del>
							);
						}
						return <span key={ index }>{ part.value }</span>;
					} ) }
				</span>
			</PostPanelRow>
		)
	);

	return (
		<PanelBody title={ __( 'Changed attributes' ) } initialOpen>
			{ fields }
		</PanelBody>
	);
}
