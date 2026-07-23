/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight, pin } from '@wordpress/icons';

export default function SidebarHeaderActions( {
	isPinned,
	onTogglePin,
	position,
	onTogglePosition,
	onToggleExpand,
	isExpanded,
} ) {
	return (
		<div className="editor-sidebar-header-actions">
			{ onToggleExpand && (
				<Button
					icon={ isExpanded ? arrowLeft : arrowRight }
					label={
						isExpanded
							? __( 'Collapse all blocks' )
							: __( 'Expand all blocks' )
					}
					onClick={ onToggleExpand }
					size="compact"
				/>
			) }
			<Button
				icon={ position === 'right' ? arrowLeft : arrowRight }
				label={
					position === 'right'
						? __( 'Move panel left' )
						: __( 'Move panel right' )
				}
				onClick={ onTogglePosition }
				size="compact"
			/>
			<Button
				icon={ pin }
				label={ isPinned ? __( 'Unpin panel' ) : __( 'Pin panel' ) }
				aria-pressed={ isPinned }
				onClick={ onTogglePin }
				size="compact"
			/>
		</div>
	);
}
