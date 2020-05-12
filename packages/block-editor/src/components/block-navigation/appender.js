/**
 * WordPress dependencies
 */
import { __experimentalTreeGridCell as TreeGridCell } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationLeaf from './leaf';
import ButtonBlockAppender from '../button-block-appender';
import DescenderLines from './descender-lines';

export default function BlockNavigationAppender( {
	parentBlockClientId,
	position,
	level,
	rowCount,
	terminatedLevels,
	path,
} ) {
	const instanceId = useInstanceId( BlockNavigationAppender );
	const descriptionId = `block-navigation-appender-row__description_${ instanceId }`;

	const appenderPositionDescription = sprintf(
		/* translators: 1: The numerical position of the block that will be inserted. 2: The level of nesting for the block that will be inserted. */
		__( 'Add block at position %1$d, Level %2$d' ),
		position,
		level
	);

	return (
		<BlockNavigationLeaf
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
		>
			<TreeGridCell
				className="block-editor-block-navigation-appender__cell"
				colSpan="3"
			>
				{ ( props ) => (
					<div className="block-editor-block-navigation-appender__container">
						<DescenderLines
							level={ level }
							isLastRow={ position === rowCount }
							terminatedLevels={ terminatedLevels }
						/>
						<ButtonBlockAppender
							rootClientId={ parentBlockClientId }
							__experimentalSelectBlockOnInsert={ false }
							aria-describedby={ descriptionId }
							{ ...props }
						/>
						<div
							className="block-editor-block-navigation-appender__description"
							id={ descriptionId }
						>
							{ appenderPositionDescription }
						</div>
					</div>
				) }
			</TreeGridCell>
		</BlockNavigationLeaf>
	);
}
