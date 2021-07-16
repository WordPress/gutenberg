/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../ui/context';
import { space, SpaceInput } from '../ui/utils/space';
import { useCx } from '../utils/hooks/use-cx';

const isDefined = < T >( o: T ): o is Exclude< T, null | undefined > =>
	typeof o !== 'undefined' && o !== null;

export interface SpacerProps {
	/**
	 * Adjusts all margins.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts top and bottom margins.
	 */
	marginY?: SpaceInput;
	/**
	 * Adjusts left and right margins.
	 */
	marginX?: SpaceInput;
	/**
	 * Adjusts top margins.
	 */
	marginTop?: SpaceInput;
	/**
	 * Adjusts bottom margins.
	 *
	 * @default 2
	 */
	marginBottom?: SpaceInput;
	/**
	 * Adjusts left margins.
	 */
	marginLeft?: SpaceInput;
	/**
	 * Adjusts right margins.
	 */
	marginRight?: SpaceInput;
	/**
	 * Adjusts all padding.
	 */
	padding?: SpaceInput;
	/**
	 * Adjusts top and bottom padding.
	 */
	paddingY?: SpaceInput;
	/**
	 * Adjusts left and right padding.
	 */
	paddingX?: SpaceInput;
	/**
	 * Adjusts top padding.
	 */
	paddingTop?: SpaceInput;
	/**
	 * Adjusts bottom padding.
	 */
	paddingBottom?: SpaceInput;
	/**
	 * Adjusts left padding.
	 */
	paddingLeft?: SpaceInput;
	/**
	 * Adjusts right padding.
	 */
	paddingRight?: SpaceInput;
	/**
	 * The children elements.
	 */
	children?: React.ReactNode;
}

export function useSpacer(
	props: PolymorphicComponentProps< SpacerProps, 'div' >
) {
	const {
		className,
		margin,
		marginBottom = 2,
		marginLeft,
		marginRight,
		marginTop,
		marginX,
		marginY,
		padding,
		paddingBottom,
		paddingLeft,
		paddingRight,
		paddingTop,
		paddingX,
		paddingY,
		...otherProps
	} = useContextSystem( props, 'Spacer' );

	const cx = useCx();

	const classes = cx(
		isDefined( marginTop ) &&
			css`
				margin-top: ${ space( marginTop ) };
			`,
		isDefined( marginBottom ) &&
			css`
				margin-bottom: ${ space( marginBottom ) };
			`,
		isDefined( marginLeft ) &&
			css`
				margin-left: ${ space( marginLeft ) };
			`,
		isDefined( marginRight ) &&
			css`
				margin-right: ${ space( marginRight ) };
			`,
		isDefined( marginX ) &&
			css`
				margin-left: ${ space( marginX ) };
				margin-right: ${ space( marginX ) };
			`,
		isDefined( marginY ) &&
			css`
				margin-bottom: ${ space( marginY ) };
				margin-top: ${ space( marginY ) };
			`,
		isDefined( margin ) &&
			css`
				margin: ${ space( margin ) };
			`,
		isDefined( paddingTop ) &&
			css`
				padding-top: ${ space( paddingTop ) };
			`,
		isDefined( paddingBottom ) &&
			css`
				padding-bottom: ${ space( paddingBottom ) };
			`,
		isDefined( paddingLeft ) &&
			css`
				padding-left: ${ space( paddingLeft ) };
			`,
		isDefined( paddingRight ) &&
			css`
				padding-right: ${ space( paddingRight ) };
			`,
		isDefined( paddingX ) &&
			css`
				padding-left: ${ space( paddingX ) };
				padding-right: ${ space( paddingX ) };
			`,
		isDefined( paddingY ) &&
			css`
				padding-bottom: ${ space( paddingY ) };
				padding-top: ${ space( paddingY ) };
			`,
		isDefined( padding ) &&
			css`
				padding: ${ space( padding ) };
			`,
		className
	);

	return { ...otherProps, className: classes };
}
