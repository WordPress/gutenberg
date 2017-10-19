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
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlockMode, getBlock } from '../selectors';
import { toggleBlockMode } from '../actions';

export function BlockModeToggle( { blockType, mode, onToggleMode } ) {
	if ( ! blockType || blockType.supportHTML === false ) {
		return null;
	}

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ onToggleMode }
			icon="html"
		>
			{ mode === 'visual'
				? __( 'Edit as HTML' )
				: __( 'Edit visually' )
			}
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
