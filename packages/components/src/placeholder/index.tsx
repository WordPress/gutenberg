/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { SVG, Path } from '@wordpress/primitives';
import { useEffect } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import type { PlaceholderProps } from './types';
import type { WordPressComponentProps } from '../context';

const PlaceholderIllustration = (
	<SVG
		className="components-placeholder__illustration"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 60 60"
		preserveAspectRatio="none"
	>
		<Path vectorEffect="non-scaling-stroke" d="M60 60 0 0" />
	</SVG>
);

/**
 * Renders a placeholder. Normally used by blocks to render their empty state.
 *
 * ```jsx
 * import { Placeholder } from '@wordpress/components';
 * import { more } from '@wordpress/icons';
 *
 * const MyPlaceholder = () => <Placeholder icon={ more } label="Placeholder" />;
 * ```
 */
export function Placeholder(
	props: WordPressComponentProps< PlaceholderProps, 'div', false >
) {
	const {
		icon,
		children,
		label,
		instructions,
		className,
		notices,
		preview,
		isColumnLayout,
		withIllustration,
		...additionalProps
	} = props;
	const [ resizeListener, { width } ] = useResizeObserver();

	// Since `useResizeObserver` will report a width of `null` until after the
	// first render, avoid applying any modifier classes until width is known.
	let modifierClassNames;
	if ( typeof width === 'number' ) {
		modifierClassNames = {
			'is-large': width >= 480,
			'is-medium': width >= 160 && width < 480,
			'is-small': width < 160,
		};
	}

	const classes = clsx(
		'components-placeholder',
		className,
		modifierClassNames,
		withIllustration ? 'has-illustration' : null
	);

	const fieldsetClasses = clsx( 'components-placeholder__fieldset', {
		'is-column-layout': isColumnLayout,
	} );

	useEffect( () => {
		if ( instructions ) {
			speak( instructions );
		}
	}, [ instructions ] );

	return (
		<div { ...additionalProps } className={ classes }>
			{ withIllustration ? PlaceholderIllustration : null }
			{ resizeListener }
			{ notices }
			{ preview && (
				<div className="components-placeholder__preview">
					{ preview }
				</div>
			) }
			<div className="components-placeholder__label">
				<Icon icon={ icon } />
				{ label }
			</div>
			{ !! instructions && (
				<div className="components-placeholder__instructions">
					{ instructions }
				</div>
			) }
			<div className={ fieldsetClasses }>{ children }</div>
		</div>
	);
}

export default Placeholder;
