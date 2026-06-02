/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

/**
 * Renders a panel of word-level diffs.
 *
 * @param {Object}  props
 * @param {string}  props.title       Panel title.
 * @param {Object}  props.entries     Map of key → diffWords parts arrays.
 * @param {boolean} props.initialOpen Whether the panel starts open.
 */
export default function RevisionDiffPanel( { title, entries, initialOpen } ) {
	if ( ! entries ) {
		return null;
	}

	const fields = Object.entries( entries ).map( ( [ key, parts ] ) => (
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
	) );

	return (
		<PanelBody title={ title } initialOpen={ initialOpen }>
			{ fields }
		</PanelBody>
	);
}
