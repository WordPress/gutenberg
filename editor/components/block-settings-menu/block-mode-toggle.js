/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlockMode, getBlock } from '../../store/selectors';
import { toggleBlockMode } from '../../store/actions';

export function BlockModeToggle( { blockType, mode, onToggleMode, small = false, ...props } ) {
	if ( ! hasBlockSupport( blockType, 'html', true ) ) {
		return null;
	}

	const label = mode === 'visual' ?
		__( 'Edit as HTML' ) :
		__( 'Edit visually' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ onToggleMode }
			icon="html"
			label={ small ? label : undefined }
			{ ...props }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state, { uid } ) => {
		const block = getBlock( state, uid );

		return {
			mode: getBlockMode( state, uid ),
			blockType: block ? getBlockType( block.name ) : null,
		};
	},
	( dispatch, { onToggle = noop, uid } ) => ( {
		onToggleMode() {
			dispatch( toggleBlockMode( uid ) );
			onToggle();
		},
	} )
)( BlockModeToggle );
