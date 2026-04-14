/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

/**
 * Renders word-level diff entries without a panel wrapper.
 *
 * @param {Object} props
 * @param {Object} props.entries Map of key → diffWords parts arrays.
 */
export function RevisionDiffEntries( { entries } ) {
	if ( ! entries ) {
		return null;
	}

	return Object.entries( entries ).map( ( [ key, parts ] ) => (
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
}

export default function RevisionDiffPanel( { title, entries, initialOpen } ) {
	if ( ! entries ) {
		return null;
	}

	return (
		<PanelBody title={ title } initialOpen={ initialOpen }>
			<RevisionDiffEntries entries={ entries } />
		</PanelBody>
	);
}
