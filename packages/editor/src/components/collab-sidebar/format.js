/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { comment as commentIcon } from '@wordpress/icons';
import { isCollapsed } from '@wordpress/rich-text';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { collabHistorySidebarName } from './constants';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

export const formatName = 'core/note';
export const format = {
	title: __( 'Note' ),
	tagName: 'span',
	className: 'wp-note',
	attributes: {
		'data-id': 'data-id',
	},
	edit: Edit,
};

function Edit( { value, isActive, activeAttributes } ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { selectedNote } = useSelect( ( select ) => {
		return {
			selectedNote: unlock( select( editorStore ) ).getSelectedNote(),
		};
	}, [] );

	if ( ! isActive && isCollapsed( value ) ) {
		return null;
	}

	return (
		<RichTextToolbarButton
			name="unknown"
			icon={ commentIcon }
			title={ __( 'Note' ) }
			onClick={ () => {
				// @todo: Correctly handle multiple sidebars.
				enableComplementaryArea( 'core', collabHistorySidebarName );
				selectNote(
					activeAttributes[ 'data-id' ]
						? Number( activeAttributes[ 'data-id' ] )
						: 'new',
					{ focus: true }
				);
			} }
			isActive={ isActive || selectedNote === 'new' }
		/>
	);
}
