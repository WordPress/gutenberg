/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cancelCircleFilled, info } from '@wordpress/icons';

/**
 * @typedef {import('./utils/types').AccessibilityIssue} AccessibilityIssue
 */

/**
 * Individual accessibility issue item component.
 *
 * @param {Object}             props            - Component props
 * @param {AccessibilityIssue} props.issue      - The accessibility issue to display
 * @param {boolean}            props.isExpanded - Whether the suggestion is expanded
 * @param {Function}           props.onToggle   - Callback to toggle expansion
 * @return {JSX.Element} The rendered component
 */
export function IssueItem( { issue, isExpanded, onToggle } ) {
	const { selectBlock } = useDispatch( blockEditorStore );

	const handleNavigate = () => {
		selectBlock( issue.clientId );
	};

	const iconComponent = issue.type === 'error' ? cancelCircleFilled : info;
	const typeClass =
		issue.type === 'error'
			? 'accessibility-insights-issue--error'
			: 'accessibility-insights-issue--warning';

	return (
		<div className={ `accessibility-insights-issue ${ typeClass }` }>
			<div className="accessibility-insights-issue__header">
				<Icon
					icon={ iconComponent }
					className="accessibility-insights-issue__icon"
				/>
				<span className="accessibility-insights-issue__message">
					{ issue.message }
				</span>
			</div>

			<div className="accessibility-insights-issue__actions">
				<Button
					__next40pxDefaultSize
					variant="link"
					className="accessibility-insights-issue__navigate"
					onClick={ handleNavigate }
				>
					{ __( 'Go to block' ) }
				</Button>

				{ issue.suggestion && (
					<Button
						__next40pxDefaultSize
						variant="link"
						className="accessibility-insights-issue__toggle"
						onClick={ onToggle }
						aria-expanded={ isExpanded }
					>
						{ isExpanded
							? __( 'Hide suggestion' )
							: __( 'Show suggestion' ) }
					</Button>
				) }
			</div>

			{ isExpanded && issue.suggestion && (
				<div className="accessibility-insights-issue__suggestion">
					{ issue.suggestion }
				</div>
			) }
		</div>
	);
}
