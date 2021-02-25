/**
 * External dependencies
 */
import {
	contextConnect,
	ContextSystemProvider,
	useContextSystem,
} from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { noop, useUpdateEffect } from '@wp-g2/utils';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlGroup } from '../control-group';
import { ButtonGroupContext } from './context';
import * as styles from './styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function ButtonGroup( props, forwardedRef ) {
	const {
		baseId,
		className,
		children,
		enableSelectNone = false,
		expanded = false,
		segmented = false,
		id,
		label = __( 'ButtonGroup' ),
		value,
		onChange = noop,
		...otherProps
	} = useContextSystem( props, 'ButtonGroup' );

	const radio = useRadioState( {
		baseId: baseId || id,
		state: value,
	} );

	useUpdateEffect( () => {
		onChange( radio.state );
	}, [ radio.state ] );

	useUpdateEffect( () => {
		radio.setState( value );
	}, [ value ] );

	const contextProps = useMemo(
		() => ( {
			buttonGroup: radio,
			enableSelectNone,
		} ),
		[ enableSelectNone, radio ]
	);

	const contextSystemProps = useMemo( () => {
		return {
			Button: {
				isBlock: expanded,
				isSubtle: ! segmented,
				isControl: true,
			},
			ControlGroup: {
				isItemBlock: expanded,
			},
		};
	}, [ expanded, segmented ] );

	const classes = cx(
		segmented && styles.segmented,
		expanded && styles.expanded,
		className
	);
	const BaseComponent = segmented ? ControlGroup : styles.ButtonGroupView;

	return (
		<ButtonGroupContext.Provider value={ contextProps }>
			<ContextSystemProvider value={ contextSystemProps }>
				<RadioGroup
					aria-label={ label }
					as={ BaseComponent }
					{ ...otherProps }
					className={ classes }
					ref={ forwardedRef }
				>
					{ children }
				</RadioGroup>
			</ContextSystemProvider>
		</ButtonGroupContext.Provider>
	);
}

/**
 * `ButtonGroup` is a form component that groups related buttons together. It can also coordinate the checked state of multiple `Button` components.
 *
 * @example
 * ```jsx
 * import { ButtonGroup, Button } from `@wordpress/components/ui`;
 *
 * function Example() {
 *  return (
 *    <ButtonGroup>
 *      <Button>Code</Button>
 *      <Button>is</Button>
 *      <Button>Poetry</Button>
 *    </ButtonGroup>
 *  );
 * }
 * ```
 */
const ConnectedButtonGroup = contextConnect( ButtonGroup, 'ButtonGroup' );

export default ConnectedButtonGroup;
