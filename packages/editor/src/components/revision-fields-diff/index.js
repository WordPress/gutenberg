/**
 * External dependencies
 */
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Renders a word-level diff between two strings using <ins> and <del> elements.
 *
 * @param {Object} props
 * @param {string} props.from The previous string value.
 * @param {string} props.to   The current string value.
 */
function StringDiff( { from, to } ) {
	const changes = diffWords( from, to );

	return (
		<span className="editor-revision-fields-diff__value">
			{ changes.map( ( part, index ) => {
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
	);
}

/**
 * Safely stringifies a value for display and comparison.
 *
 * @param {*} value The value to stringify.
 * @return {string} The stringified value.
 */
function stringifyValue( value ) {
	if ( value === null || value === undefined ) {
		return '';
	}
	if ( typeof value === 'string' ) {
		return value;
	}
	return JSON.stringify( value, null, 2 );
}

/**
 * Panel that shows meta field diffs between the current revision and
 * the previous revision in the document sidebar during revision mode.
 */
export default function RevisionFieldsDiffPanel() {
	const { revision, previousRevision } = useSelect( ( select ) => {
		const { getCurrentRevision, getPreviousRevision } = unlock(
			select( editorStore )
		);

		return {
			revision: getCurrentRevision(),
			previousRevision: getPreviousRevision(),
		};
	}, [] );

	if ( ! revision ) {
		return null;
	}

	const revisionMeta = revision.meta ?? {};
	const previousMeta = previousRevision?.meta ?? {};
	const allMetaKeys = new Set( [
		...Object.keys( revisionMeta ),
		...Object.keys( previousMeta ),
	] );

	const fields = [];

	for ( const key of allMetaKeys ) {
		const revValue = revisionMeta[ key ];
		const prevValue = previousMeta[ key ];

		// Skip empty values on both sides.
		if (
			( revValue === undefined ||
				revValue === null ||
				revValue === '' ) &&
			( prevValue === undefined ||
				prevValue === null ||
				prevValue === '' )
		) {
			continue;
		}

		const revStr = stringifyValue( revValue );
		const prevStr = stringifyValue( prevValue );

		if ( revStr === prevStr ) {
			fields.push(
				<PostPanelRow key={ `meta-${ key }` } label={ key }>
					<span className="editor-revision-fields-diff__value">
						{ revStr }
					</span>
				</PostPanelRow>
			);
		} else {
			fields.push(
				<PostPanelRow key={ `meta-${ key }` } label={ key }>
					<StringDiff from={ prevStr } to={ revStr } />
				</PostPanelRow>
			);
		}
	}

	if ( fields.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Meta' ) } initialOpen={ false }>
			{ fields }
		</PanelBody>
	);
}
