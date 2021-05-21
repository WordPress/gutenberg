/**
 * Internal dependencies
 */
import { VisuallyHidden as NextVisuallyHidden } from '../ui/visually-hidden';
import { withNext } from '../ui/context';

const VisuallyHidden =
	process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextVisuallyHidden : undefined;

/**
 * There is nothing to adapt, the props are equal.
 *
 * @param {import('.').Props<any>} props
 * @return {import('../ui/visually-hidden/hook').Props} Adapted props
 */
const adapter = ( props ) =>
	/** @type {import('../ui/visually-hidden/hook').Props} */ ( props );

/**
 * The generic type is too difficult to type here, default to any to circumvent that.
 *
 * @param {import('react').ForwardRefExoticComponent<import('.').Props<any>>} Current
 */
export function withNextComponent( Current ) {
	return withNext(
		Current,
		VisuallyHidden,
		'WPComponentsVisuallyHidden',
		adapter
	);
}
