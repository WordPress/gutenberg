/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { ArrowDownAlt2Icon, ArrowUpAlt2Icon } from 'dashicons';
import classNames from 'classnames';

export default function BlockArrangement( { moveBlockUp, moveBlockDown, first, last } ) {
	return (
		<div className="block-arrangement">
			<button
				className={ classNames( 'block-arrangement__control', { 'is-disabled': first } ) }
				onClick={ moveBlockUp }
			>
				<ArrowUpAlt2Icon />
			</button>
			<button
				className={ classNames( 'block-arrangement__control', { 'is-disabled': last } ) }
				onClick={ moveBlockDown }
			>
				<ArrowDownAlt2Icon />
			</button>
		</div>
	);
}
