/**
 * External dependencies
 */
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { RichTextData } from '@wordpress/rich-text';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';

// Internal attribute keys injected by the diff pipeline.
const INTERNAL_KEYS = new Set( [
	'__revisionDiffStatus',
	'__previousAttributes',
] );

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
	if ( value instanceof RichTextData ) {
		return value.toHTMLString();
	}
	if ( typeof value === 'string' ) {
		return value;
	}
	return JSON.stringify( value, null, 2 );
}

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
 * Returns the set of attribute keys that have `source: 'rich-text'` for a
 * given block type. These are already diffed inline in the canvas.
 *
 * @param {Object|undefined} blockType Block type definition.
 * @return {Set<string>} Rich-text attribute keys.
 */
function getRichTextKeys( blockType ) {
	const keys = new Set();
	if ( ! blockType?.attributes ) {
		return keys;
	}
	for ( const [ key, def ] of Object.entries( blockType.attributes ) ) {
		if ( def.source === 'rich-text' ) {
			keys.add( key );
		}
	}
	return keys;
}

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

	const blockType = getBlockType( block.name );
	const diffStatus = block.attributes?.__revisionDiffStatus;
	const previousAttrs = block.attributes?.__previousAttributes ?? {};
	const currentAttrs = block.attributes ?? {};
	const richTextKeys = getRichTextKeys( blockType );

	// Collect all attribute keys from both sides.
	const allKeys = new Set( [
		...Object.keys( currentAttrs ),
		...Object.keys( previousAttrs ),
	] );

	const fields = [];

	for ( const key of allKeys ) {
		// Skip internal diff keys and rich-text attributes (already diffed in canvas).
		if ( INTERNAL_KEYS.has( key ) || richTextKeys.has( key ) ) {
			continue;
		}

		const currStr = stringifyValue( currentAttrs[ key ] );
		const prevStr = stringifyValue( previousAttrs[ key ] );

		// Only show attributes that actually changed.
		if ( currStr === prevStr ) {
			continue;
		}

		if ( diffStatus === 'added' && currStr ) {
			fields.push(
				<PostPanelRow key={ key } label={ key }>
					<span className="editor-revision-fields-diff__value">
						<ins className="editor-revision-fields-diff__added">
							{ currStr }
						</ins>
					</span>
				</PostPanelRow>
			);
		} else if ( diffStatus === 'removed' && prevStr ) {
			fields.push(
				<PostPanelRow key={ key } label={ key }>
					<span className="editor-revision-fields-diff__value">
						<del className="editor-revision-fields-diff__removed">
							{ prevStr }
						</del>
					</span>
				</PostPanelRow>
			);
		} else if ( diffStatus === 'modified' ) {
			fields.push(
				<PostPanelRow key={ key } label={ key }>
					<StringDiff from={ prevStr } to={ currStr } />
				</PostPanelRow>
			);
		}
	}

	if ( fields.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Changed attributes' ) } initialOpen>
			{ fields }
		</PanelBody>
	);
}
