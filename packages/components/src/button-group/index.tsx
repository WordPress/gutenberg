/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ButtonGroupProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

function UnforwardedButtonGroup(
	props: WordPressComponentProps< ButtonGroupProps, 'div', false >,
	ref: ForwardedRef< HTMLDivElement >
) {
	const { className, ...restProps } = props;
	const classes = classnames( 'components-button-group', className );

	return (
		<div ref={ ref } role="group" className={ classes } { ...restProps } />
	);
}

/**
 * ButtonGroup can be used to group any related buttons together. To emphasize
 * related buttons, a group should share a common container.
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
