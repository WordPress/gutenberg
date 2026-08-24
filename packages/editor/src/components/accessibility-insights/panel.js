/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMemo, useState, useCallback } from '@wordpress/element';
import { PanelBody, Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { IssueItem } from './issue-item';
import {
	getAccessibilityIssues,
	groupIssuesByCategory,
	countIssues,
	getCategoryLabel,
} from './utils/analyze';
import { store as editorStore } from '../../store';

/**
 * @typedef {import('./utils/types').AccessibilityIssue} AccessibilityIssue
 */

/**
 * Summary component showing error and warning counts.
 *
 * @param {Object} props          - Component props
 * @param {number} props.errors   - Number of errors
 * @param {number} props.warnings - Number of warnings
 * @return {JSX.Element} The rendered component
 */
function Summary( { errors, warnings } ) {
	if ( errors === 0 && warnings === 0 ) {
		return (
			<Notice
				status="success"
				isDismissible={ false }
				className="accessibility-insights-summary--success"
			>
				{ __( 'No accessibility issues found. Great job!' ) }
			</Notice>
		);
	}

	return (
		<div className="accessibility-insights-summary">
			{ errors > 0 && (
				<span className="accessibility-insights-summary__errors">
					{ errors } { errors === 1 ? 'error' : 'errors' }
				</span>
			) }
			{ warnings > 0 && (
				<span className="accessibility-insights-summary__warnings">
					{ warnings } { warnings === 1 ? 'warning' : 'warnings' }
				</span>
			) }
		</div>
	);
}

/**
 * Category section component showing issues grouped by category.
 *
 * @param {Object}               props          - Component props
 * @param {string}               props.category - Category key
 * @param {AccessibilityIssue[]} props.issues   - Issues in this category
 * @param {Object}               props.expanded - Map of expanded issue IDs
 * @param {Function}             props.onToggle - Toggle callback
 * @return {JSX.Element} The rendered component
 */
function CategorySection( { category, issues, expanded, onToggle } ) {
	const errorCount = issues.filter( ( i ) => i.type === 'error' ).length;
	const warningCount = issues.filter( ( i ) => i.type === 'warning' ).length;

	const title = `${ getCategoryLabel( category ) } (${ issues.length })`;

	return (
		<PanelBody title={ title } initialOpen={ errorCount > 0 }>
			<div className="accessibility-insights-category__counts">
				{ errorCount > 0 && (
					<span className="accessibility-insights-category__error-count">
						{ errorCount } { errorCount === 1 ? 'error' : 'errors' }
					</span>
				) }
				{ warningCount > 0 && (
					<span className="accessibility-insights-category__warning-count">
						{ warningCount }{ ' ' }
						{ warningCount === 1 ? 'warning' : 'warnings' }
					</span>
				) }
			</div>

			<div className="accessibility-insights-category__issues">
				{ issues.map( ( issue ) => (
					<IssueItem
						key={ issue.id }
						issue={ issue }
						isExpanded={ !! expanded[ issue.id ] }
						onToggle={ () => onToggle( issue.id ) }
					/>
				) ) }
			</div>
		</PanelBody>
	);
}

/**
 * Main accessibility insights panel component.
 *
 * @return {JSX.Element} The rendered component
 */
export function AccessibilityInsightsPanel() {
	const [ expandedIssues, setExpandedIssues ] = useState( {} );

	// Subscribe to content changes to trigger re-analysis when blocks are edited.
	// getEditedPostContent() changes on every edit, ensuring fresh analysis.
	const { blocks, serializedContent } = useSelect( ( select ) => {
		return {
			blocks: select( blockEditorStore ).getBlocks(),
			serializedContent: select( editorStore ).getEditedPostContent(),
		};
	}, [] );

	// Analyze blocks for accessibility issues.
	// serializedContent in deps triggers re-analysis when block content changes.
	const issues = useMemo(
		() => getAccessibilityIssues( blocks ),
		[ blocks, serializedContent ]
	);

	// Group issues by category
	const groupedIssues = useMemo(
		() => groupIssuesByCategory( issues ),
		[ issues ]
	);

	// Get counts
	const counts = useMemo( () => countIssues( issues ), [ issues ] );

	// Toggle expanded state for an issue
	const handleToggle = useCallback( ( issueId ) => {
		setExpandedIssues( ( prev ) => ( {
			...prev,
			[ issueId ]: ! prev[ issueId ],
		} ) );
	}, [] );

	// Get categories with issues, sorted with errors first
	const categories = Object.keys( groupedIssues ).sort( ( a, b ) => {
		const aErrors = groupedIssues[ a ].filter(
			( i ) => i.type === 'error'
		).length;
		const bErrors = groupedIssues[ b ].filter(
			( i ) => i.type === 'error'
		).length;
		return bErrors - aErrors;
	} );

	return (
		<div className="accessibility-insights-panel">
			<div className="accessibility-insights-panel__header">
				<p className="accessibility-insights-panel__description">
					{ __(
						'Review accessibility issues in your content. Fix errors to ensure your content is accessible to all users.'
					) }
				</p>

				<Summary
					errors={ counts.errors }
					warnings={ counts.warnings }
				/>
			</div>

			<div className="accessibility-insights-panel__content">
				{ categories.map( ( category ) => (
					<CategorySection
						key={ category }
						category={ category }
						issues={ groupedIssues[ category ] }
						expanded={ expandedIssues }
						onToggle={ handleToggle }
					/>
				) ) }
			</div>
		</div>
	);
}
