/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { comment as commentIcon } from '@wordpress/icons';
import { isCollapsed } from '@wordpress/rich-text';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { ALL_NOTES_SIDEBAR, FLOATING_NOTES_SIDEBAR } from './constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export const NOTE_FORMAT_NAME = 'core/note';

export const noteFormat = {
	title: __( 'Add note' ),
	tagName: 'mark',
	className: 'wp-note',
	attributes: {
		'data-id': 'data-id',
	},
	edit: NoteFormatEdit,
};

function NoteFormatEdit( { value, isActive, activeAttributes } ) {
	const dispatch = useDispatch();
	// Static selector getter: the active area is only read when the button is
	// clicked, so there's no need to subscribe and re-render on its changes.
	const { getActiveComplementaryArea } = useSelect( interfaceStore );

	// Toolbar button only relevant on an active selection or when standing on
	// an existing inline note marker.
	if ( ! isActive && isCollapsed( value ) ) {
		return null;
	}

	const onClick = () => {
		// Bias the floating sidebar when no fixed sidebar is mounted; the
		// floating panel is the default placement and avoids a layout shift.
		const currentArea = getActiveComplementaryArea( 'core' );
		const targetSidebar =
			currentArea === ALL_NOTES_SIDEBAR
				? ALL_NOTES_SIDEBAR
				: FLOATING_NOTES_SIDEBAR;
		if ( currentArea !== targetSidebar ) {
			dispatch( interfaceStore ).enableComplementaryArea(
				'core',
				targetSidebar
			);
		}

		const id = activeAttributes[ 'data-id' ];
		unlock( dispatch( editorStore ) ).selectNote(
			id ? Number( id ) : 'new',
			{ focus: true }
		);
	};

	return (
		<RichTextToolbarButton
			icon={ commentIcon }
			title={ __( 'Add note' ) }
			onClick={ onClick }
			isActive={ isActive }
		/>
	);
}
