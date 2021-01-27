/**
 * External dependencies
 */
import { times } from 'lodash';
import classnames from 'classnames';

const lineClassName = 'block-editor-block-navigator-indentation';

export default function Indentation( { level } ) {
	return times( level - 1, ( index ) => {
		// The first 'level' that has an indentation is level 2.
		// Add 2 to the zero-based index below to reflect that.
		const currentLevel = index + 2;
		const hasItem = currentLevel === level;
		return (
			<div
				key={ index }
				aria-hidden="true"
				className={ classnames( lineClassName, {
					'has-item': hasItem,
				} ) }
			/>
		);
	} );
}
