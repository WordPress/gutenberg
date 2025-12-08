/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { dateI18n, getSettings } from '@wordpress/date';

/**
 * @typedef {import('./utils/types').Revision} Revision
 */

/**
 * Formats a revision for display in the dropdown.
 *
 * @param {Object} revision - The revision object
 * @return {string} Formatted label
 */
function formatRevisionLabel( revision ) {
	const dateFormat = getSettings().formats.datetime;
	const formattedDate = dateI18n( dateFormat, revision.date );
	const authorName =
		revision.author_name || revision.author || __( 'Unknown' );

	return sprintf(
		/* translators: 1: revision date, 2: author name */
		__( '%1$s by %2$s' ),
		formattedDate,
		authorName
	);
}

/**
 * Revision selector component.
 *
 * @param {Object}   props              - Component props
 * @param {Array}    props.revisions    - Array of revision objects
 * @param {number}   props.fromId       - Selected source revision ID
 * @param {number}   props.toId         - Selected target revision ID
 * @param {Function} props.onFromChange - Callback when source changes
 * @param {Function} props.onToChange   - Callback when target changes
 * @return {JSX.Element} The rendered component
 */
export function RevisionSelector( {
	revisions,
	fromId,
	toId,
	onFromChange,
	onToChange,
} ) {
	if ( ! revisions || revisions.length < 2 ) {
		return (
			<div className="revision-diff-viewer__selector-empty">
				{ __( 'Not enough revisions to compare.' ) }
			</div>
		);
	}

	const options = revisions.map( ( revision ) => ( {
		value: revision.id.toString(),
		label: formatRevisionLabel( revision ),
	} ) );

	return (
		<div className="revision-diff-viewer__selector">
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'From revision' ) }
				value={ fromId?.toString() || '' }
				options={ options }
				onChange={ ( value ) => onFromChange( parseInt( value, 10 ) ) }
			/>
			<span className="revision-diff-viewer__selector-arrow">→</span>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'To revision' ) }
				value={ toId?.toString() || '' }
				options={ options }
				onChange={ ( value ) => onToChange( parseInt( value, 10 ) ) }
			/>
		</div>
	);
}
