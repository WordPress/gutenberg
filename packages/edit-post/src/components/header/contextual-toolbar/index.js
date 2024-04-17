/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockToolbar,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { useHasBlockToolbar } = unlock( blockEditorPrivateApis );

function ContextualToolbar( { isCollapsed, onCollapse } ) {
	const blockToolbarRef = useRef();
	const hasBlockToolbar = useHasBlockToolbar();

	if ( ! hasBlockToolbar ) {
		return null;
	}

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

			<Button
				className="edit-post-header__block-tools-toggle"
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

export default ContextualToolbar;
