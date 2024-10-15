/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { ButtonGroupProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedButtonGroup(
	props: WordPressComponentProps< ButtonGroupProps, 'div', false >,
	ref: ForwardedRef< HTMLDivElement >
) {
	const { className, ...restProps } = props;
	const classes = clsx( 'components-button-group', className );

	/**
	 * Add deprecation notice for `ButtonGroup` component.
	 */
	deprecated( 'wp.components.ButtonGroup', {
		since: '6.7',
		alternative: 'wp.components.ToggleGroupControl',
	} );

	return (
		<div ref={ ref } role="group" className={ classes } { ...restProps } />
	);
}

/**
 * ButtonGroup can be used to group any related buttons together. To emphasize
 * related buttons, a group should share a common container.
 *
 * @deprecated use `ToggleGroupControl` instead.
 *
 * ```jsx
 * import { Button, ButtonGroup } from '@wordpress/components';
 *
 * const MyButtonGroup = () => (
 *   <ButtonGroup>
 *     <Button variant="primary">Button 1</Button>
 *     <Button variant="primary">Button 2</Button>
 *   </ButtonGroup>
 * );
 * ```
 */
export const ButtonGroup = forwardRef( UnforwardedButtonGroup );

export default ButtonGroup;
