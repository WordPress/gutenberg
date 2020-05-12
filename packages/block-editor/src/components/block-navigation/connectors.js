/**
 * External dependencies
 */
import { times } from 'lodash';
import classnames from 'classnames';

/**
 * Renders visual connector lines for the connection between a child and parent
 * block.
 *
 * This component renders multiple vertical lines for each level starting from level 2.
 */
export default function Connectors( { level, isLastRow, terminatedLevels } ) {
	return (
		<td
			className="block-editor-block-navigation-connectors"
			aria-hidden="true"
		>
			{ times( level - 1, ( index ) => {
				// The first 'level' that has a descender line is level 2.
				// Add 2 to the zero-based index below to reflect that.
				const currentLevel = index + 2;
				const hasItem = currentLevel === level;
				return (
					<div
						key={ index }
						aria-hidden="true"
						className={ classnames(
							'block-editor-block-navigation-connectors__line',
							{
								'has-item': hasItem,
								'is-last-row': isLastRow,
								'is-terminated': terminatedLevels.includes(
									currentLevel
								),
							}
						) }
					/>
				);
			} ) }
		</td>
	);
}
