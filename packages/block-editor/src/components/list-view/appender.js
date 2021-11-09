/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridCell as TreeGridCell } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ListViewLeaf from './leaf';
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';

export default function ListViewAppender( {
	parentBlockClientId,
	position,
	level,
	rowCount,
	path,
} ) {
	const isDragging = useSelect(
		( select ) => {
			const { isBlockBeingDragged, isAncestorBeingDragged } = select(
				blockEditorStore
			);

			return (
				isBlockBeingDragged( parentBlockClientId ) ||
				isAncestorBeingDragged( parentBlockClientId )
			);
		},
		[ parentBlockClientId ]
	);
	const instanceId = useInstanceId( ListViewAppender );
	const descriptionId = `list-view-appender-row__description_${ instanceId }`;

	const appenderPositionDescription = sprintf(
		/* translators: 1: The numerical position of the block that will be inserted. 2: The level of nesting for the block that will be inserted. */
		__( 'Add block at position %1$d, Level %2$d' ),
		position,
		level
	);

	return (
		<ListViewLeaf
			className={ classnames( { 'is-dragging': isDragging } ) }
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
		>
			<TreeGridCell
				className="block-editor-list-view-appender__cell"
				colSpan="3"
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-list-view-appender__container">
						<Inserter
							rootClientId={ parentBlockClientId }
							__experimentalIsQuick
							aria-describedby={ descriptionId }
							toggleProps={ { ref, tabIndex, onFocus } }
						/>
						<div
							className="block-editor-list-view-appender__description"
							id={ descriptionId }
						>
							{ appenderPositionDescription }
						</div>
					</div>
				) }
			</TreeGridCell>
		</ListViewLeaf>
	);
}
