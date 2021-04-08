/**
 * External dependencies
 */
import hoistNonReactStatics from 'hoist-non-react-statics';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { INTERPOLATION_CLASS_NAME } from './constants';
import { tags } from './tags';
import { compileInterpolatedStyles, getInterpolatedClassName } from './utils';

/**
 * @typedef CreateStyledComponentsProps
 * @property {import('../create-compiler').Compiler} compiler The (custom) Emotion instance.
 * @property {import('./polymorphic-component').CoreElements} core The collection of coreElements.
 */

/**
 * Creates a set of styled components for the Style system.
 * These styled components are similarly to Emotion's or Styled-Components styled.div``.
 *
 * A big difference is that the Style system's styled components do NOT require
 * context connection at all. This is HUGE for performance as there are far less
 * React.Component nodes within the render tree.
 *
 * This is thanks to how the Style system compiles and coordinates style values.
 *
 * @param {CreateStyledComponentsProps} props Props to create styled components with.
 * @return {import('./polymorphic-component').CreateStyled} A set of styled components.
 */
export function createStyledComponents( { compiler, core } ) {
	const { css, cx, generateInterpolationName } = compiler;

	/**
	 * That's all a <Box /> is :). A core.div.
	 */
	const Box = core.div;

	/**
	 *
	 * @param {import('react').ElementType} tagName
	 * @param {any} options
	 */
	function createStyled( tagName, options = {} ) {
		const {
			/**
			 * A way to pass in extraProps when created a styled component.
			 */
			props: extraProps,
		} = options;

		return ( /** @type {any[]} */ ...interpolatedProps ) => {
			const interpolationClassName = getInterpolatedClassName(
				generateInterpolationName()
			);
			/** @type {import('react').ForwardRefRenderFunction<any, any>} */
			const Render = ( { as: asProp, className, ...props }, ref ) => {
				// Combine all of the props together.
				const mergedProps = { ...extraProps, ...props, ref };

				const baseTag = asProp || tagName;

				// Resolves prop interpolation.
				const interpolatedStyles = compileInterpolatedStyles(
					interpolatedProps,
					props
				);

				const classes = cx(
					css( ...interpolatedStyles ),
					className,
					interpolationClassName
				);

				return (
					<Box
						as={ baseTag }
						{ ...mergedProps }
						className={ classes }
					/>
				);
			};

			const StyledComponent = forwardRef( Render );

			/*
			 * Enhancing the displayName.
			 */
			if ( typeof tagName === 'string' ) {
				StyledComponent.displayName = `Styled(${ getDisplayName(
					tagName
				) })`;
			} else if ( typeof tagName?.displayName !== 'undefined' ) {
				StyledComponent.displayName = tagName.displayName;
			} else {
				StyledComponent.displayName = `Styled(${ getDisplayName(
					tagName
				) })`;
			}

			/*
			 * Enhancing .withComponent()
			 * https://github.com/emotion-js/emotion/blob/master/packages/styled-base/src/index.js#L210
			 *
			 * This step is essential as we want styled components generated with
			 * .withComponent to have the correct baseStyles.
			 */
			// @ts-ignore
			StyledComponent.withComponent = (
				/** @type {import('react').ElementType} */ nextTag,
				/** @type {any} */ nextOptions
			) => {
				return createStyled(
					nextTag,
					nextOptions !== undefined
						? { ...( options || {} ), ...nextOptions }
						: options
				)( ...interpolatedProps );
			};

			// @ts-ignore internal property
			StyledComponent[
				INTERPOLATION_CLASS_NAME
			] = interpolationClassName;

			if ( typeof tagName !== 'string' ) {
				/*
				 * Hoisting statics one last time, if the tagName is a Component,
				 * rather than an HTML tag, like `div`.
				 */
				return hoistNonReactStatics( StyledComponent, tagName );
			}
			return StyledComponent;
		};
	}

	// Bind it to avoid mutating the original function. Just like @emotion/styled:
	// https://github.com/emotion-js/emotion/blob/master/packages/styled/src/index.js
	/* eslint-disable jsdoc/valid-types */
	/** @type {typeof createStyled & { [P in keyof JSX.IntrinsicElements]: ReturnType<typeof createStyled>}} */
	// @ts-ignore We fill in the missing properties below
	const styled = createStyled.bind( undefined );
	/* eslint-enable jsdoc/valid-types */

	// Generating the core collection of styled[tagName], with our enhanced
	// version of styled.
	tags.forEach( ( tagName ) => {
		styled[ tagName ] = createStyled( tagName );
	} );

	// @ts-ignore We cannot convince TypeScript that we've taken care of everything here, we're doing too many JavaScript magics for this to work without an ignore
	return styled;
}

/**
 * Gets the displayName of a React Component or element.
 *
 * @param {string | import('react').ComponentType} tagName
 *
 * @return {string} The display name of the Component / tagName.
 */
export function getDisplayName( tagName ) {
	const displayName =
		typeof tagName === 'string'
			? tagName
			: tagName.displayName || tagName.name || 'Component';

	return displayName;
}
