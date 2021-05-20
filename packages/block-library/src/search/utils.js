/**
 * Constants
 */
export const PC_WIDTH_DEFAULT = 50;
export const PX_WIDTH_DEFAULT = 350;
export const MIN_WIDTH = 220;
export const MIN_WIDTH_UNIT = 'px';
const SEARCHFIELD_ANIMATION_DURATION = 300;

/**
 * Returns a boolean whether passed unit is percentage
 *
 * @param {string} unit Block width unit.
 *
 * @return {boolean} 	Whether unit is '%'.
 */
export function isPercentageUnit( unit ) {
	return unit === '%';
}

export function hideSearchField( wrapper, searchField, button ) {
	searchField.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
	wrapper.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
	wrapper.style.width = `${ button.offsetWidth }px`;

	const removeTransitions = setTimeout( () => {
		wrapper.style.transitionDuration = 'unset';

		clearTimeout( removeTransitions );
	}, SEARCHFIELD_ANIMATION_DURATION );
}

export function showSearchField( wrapper, searchField, width, widthUnit ) {
	searchField.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
	wrapper.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
	wrapper.style.width = `${ width }${ widthUnit }`;

	const removeTransitions = setTimeout( () => {
		searchField.style.width = `${ width }${ widthUnit }`;
		wrapper.style.transitionDuration = 'unset';

		clearTimeout( removeTransitions );
	}, SEARCHFIELD_ANIMATION_DURATION );
}
