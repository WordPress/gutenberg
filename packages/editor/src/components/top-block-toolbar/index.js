/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
import { Button, Popover } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

function TopBlockToolbar( { isCollapsed, onCollapse } ) {
	const blockToolbarRef = useRef();

	return (
		<>
			<div
				className={ classnames( 'top-block-toolbar', {
					'is-collapsed': isCollapsed,
				} ) }
			>
				<BlockToolbar hideDragHandle />
			</div>
			<Popover.Slot ref={ blockToolbarRef } name="block-toolbar" />
			<Button
				className="top-block-toolbar__collapse-toggle"
				icon={ isCollapsed ? next : previous }
				onClick={ onCollapse }
				label={
					isCollapsed
						? __( 'Show block tools' )
						: __( 'Hide block tools' )
				}
				size="compact"
			/>
		</>
	);
}

export default TopBlockToolbar;
