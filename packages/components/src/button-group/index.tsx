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
	const { className, __shouldNotWarnDeprecated, ...restProps } = props;
	const classes = clsx( 'components-button-group', className );

	if ( ! __shouldNotWarnDeprecated ) {
		deprecated( 'wp.components.ButtonGroup', {
			since: '6.8',
			alternative: 'wp.components.__experimentalToggleGroupControl',
		} );
	}

	return (
		<div ref={ ref } role="group" className={ classes } { ...restProps } />
	);
}

/**
 * ButtonGroup can be used to group any related buttons together. To emphasize
 * related buttons, a group should share a common container.
 *
 * @deprecated Use `ToggleGroupControl` instead.
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
