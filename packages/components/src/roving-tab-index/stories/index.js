/**
 * Internal dependencies
 */
import RovingTabIndex, { RovingTabIndexItem } from '../';
import { Button } from '../../';

export default {
	title: 'Components/RovingTabIndex',
	component: RovingTabIndex,
};

export const _default = () => {
	const onKeyDown = ( event ) => {
		// Left key pressed.
		if ( event.keyCode === 37 ) {
			const previous = event.target.previousElementSibling;
			if ( previous ) {
				previous.focus();
			}
		}
		// Right key pressed.
		if ( event.keyCode === 39 ) {
			const next = event.target.nextElementSibling;
			if ( next ) {
				next.focus();
			}
		}
		// Home key pressed.
		if ( event.keyCode === 36 ) {
			const first = event.target.parentElement.firstElementChild;
			if ( first ) {
				first.focus();
			}
		}
		// End key pressed.
		if ( event.keyCode === 35 ) {
			const last = event.target.parentElement.lastElementChild;
			if ( last ) {
				last.focus();
			}
		}
	};

	return (
		<RovingTabIndex>
			<div
				role="toolbar"
				aria-label="Toolbar Example"
				style={ { display: 'flex' } }
				onKeyDown={ onKeyDown }
			>
				<RovingTabIndexItem as={ Button } isPrimary>
					Item 1
				</RovingTabIndexItem>
				<RovingTabIndexItem as={ Button } isPrimary>
					Item 2
				</RovingTabIndexItem>
				<RovingTabIndexItem as={ Button } isPrimary>
					Item 3
				</RovingTabIndexItem>
			</div>
		</RovingTabIndex>
	);
};
