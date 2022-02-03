/**
 * External dependencies
 */
import { matcherHint } from 'jest-matcher-utils';

/**
 * Internal dependencies
 */
import { checkReactElement, printElement } from './utils';

function isStyleVisible( element ) {
	const style = element.props.style || {};
	const { display = 'flex', opacity = 1 } = Array.isArray( style )
		? Object.assign( {}, ...style )
		: style;
	return display !== 'none' && opacity !== 0;
}

function isAttributeVisible( element ) {
	return element.type !== 'Modal' || ! element.props.visible === false;
}

function isElementVisible( element ) {
	return (
		isStyleVisible( element ) &&
		isAttributeVisible( element ) &&
		( ! element.parent || isElementVisible( element.parent ) )
	);
}

/**
 * Check that the given element is visible.
 *
 * An element is visible if ALL the following conditions are met:
 *
 * - it does not have its style property "display" set to "none".
 * - it does not have its style property "opacity" set to "0".
 * - it is not a "Modal" component or it does not have the prop "visible" set to "false".
 * - its ancestor elements are also visible.
 *
 * @param {import('react-test-renderer').ReactTestInstance} element
 * @return {boolean} True if the given element is visible.
 */
export function toBeVisible( element ) {
	checkReactElement( element, toBeVisible, this );
	const isVisible = isElementVisible( element );
	return {
		pass: isVisible,
		message: () => {
			const is = isVisible ? 'is' : 'is not';
			return [
				matcherHint(
					`${ this.isNot ? '.not' : '' }.toBeVisible`,
					'element',
					''
				),
				'',
				`Received element ${ is } visible`,
				printElement( element ),
			].join( '\n' );
		},
	};
}
