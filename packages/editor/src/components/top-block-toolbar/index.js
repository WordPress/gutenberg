/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BlockToolbar } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
import { Popover } from '@wordpress/components';

function TopBlockToolbar( { isCollapsed } ) {
	const blockToolbarRef = useRef();

	return (
		<>
			<div
				className={ classnames( 'selected-block-tools-wrapper', {
					'is-collapsed': isCollapsed,
				} ) }
			>
				<BlockToolbar hideDragHandle />
			</div>
			<Popover.Slot ref={ blockToolbarRef } name="block-toolbar" />
		</>
	);
}

export default TopBlockToolbar;
