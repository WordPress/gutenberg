/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Used inside of <PostStatus> as an alternative to <ToolsPanelItem> for when
 * you want something to appear full width but don't want to give it a label
 * that appears in the <ToolsPanel> dropdown.
 *
 * @param {Object}      params
 * @param {string}      params.className
 * @param {JSX.Element} params.children
 */
export default function PostStatusRow( { className, children } ) {
	return (
		<div className={ classnames( 'edit-post-post-status-row', className ) }>
			{ children }
		</div>
	);
}
