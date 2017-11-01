/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { setActivePanel } from '../actions';

export function BlockInspectorButton( {
	onShowInspector,
	onClick = noop,
	small = false,
} ) {
	const label = __( 'Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onShowInspector, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	undefined,
	{
		onShowInspector: () => setActivePanel( 'block' ),
	},
)( BlockInspectorButton );
