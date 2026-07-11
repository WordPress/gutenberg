/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { comment as commentIcon } from '@wordpress/icons';
import { isCollapsed } from '@wordpress/rich-text';
import { store as interfaceStore } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ALL_NOTES_SIDEBAR } from './constants';
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
	const isLargeViewport = useViewportMatch( 'medium' );

	// Toolbar button only relevant on an active selection or when standing on
	// an existing inline note marker.
	if ( ! isActive && isCollapsed( value ) ) {
		return null;
	}

	const onClick = () => {
		// On small viewports the "All notes" sidebar is the only notes
		// surface; on large viewports the floating notes panel shows
		// automatically once a note is selected.
		if ( ! isLargeViewport ) {
			dispatch( interfaceStore ).enableComplementaryArea(
				'core',
				ALL_NOTES_SIDEBAR
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
