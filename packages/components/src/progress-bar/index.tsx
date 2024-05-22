/**
 * External dependencies
 */
import type { CSSProperties, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as ProgressBarStyled from './styles';
import type { ProgressBarProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'progress', false >,
	ref: ForwardedRef< HTMLProgressElement >
) {
	const { className, value, ...progressProps } = props;
	const isIndeterminate = ! Number.isFinite( value );

	return (
		<ProgressBarStyled.Track className={ className }>
			<ProgressBarStyled.Indicator
				style={
					{
						'--indicator-width': ! isIndeterminate
							? `${ value }%`
							: undefined,
					} as CSSProperties
				}
				isIndeterminate={ isIndeterminate }
			/>
			<ProgressBarStyled.ProgressElement
				max={ 100 }
				value={ value }
				aria-label={ __( 'Loading …' ) }
				ref={ ref }
				{ ...progressProps }
			/>
		</ProgressBarStyled.Track>
	);
}

/**
 * A simple horizontal progress bar component.
 *
 * Supports two modes: determinate and indeterminate. A progress bar is determinate when a specific progress value has been specified (from 0 to 100), and indeterminate when a value hasn't been specified.
 *
 * ## Usage
 *
 * ```jsx
 * import { ProgressBar } from '@wordpress/components';
 *
 * const MyLoadingComponent = () => {
 *   return <ProgressBar />
 * }
 * ```
 *
 * The ProgressBar will expand to take all the available horizontal space of its immediate parent container element. To control its width, you can:
 *
 * Pass a custom CSS `className` that takes care of setting the `width`:
 *
 * ```css
 * .my-css-class {
 *   width: 160px;
 * }
 * ```
 *
 * ```jsx
 * import { ProgressBar } from '@wordpress/components';
 *
 * const MyLoadingComponent = () => {
 *   return <ProgressBar className="my-css-class" />;
 * };
 * ```
 *
 * Wrap it in a container element (e.g `<div>`) that has a `width` specified:
 *
 * ```jsx
 * import { ProgressBar } from '@wordpress/components';
 *
 * const MyLoadingComponent = ( props ) => {
 *   return (
 *     <div style={ { width: '160px' } }>
 *       <ProgressBar />
 *     </div>
 *   );
 * };
 * ```
 */
export const ProgressBar = forwardRef( UnforwardedProgressBar );

export default ProgressBar;
