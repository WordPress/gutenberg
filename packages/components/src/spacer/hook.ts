/**
 * External dependencies
 */
import { css, cx } from 'emotion';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { ViewOwnProps } from '../ui/context';
import { space } from '../ui/utils/space';

const isDefined = < T >( o: T ): o is Exclude< T, null | undefined > =>
	typeof o !== 'undefined' && o !== null;

export interface SpacerProps {
	/**
	 * Adjusts all margins.
	 */
	m?: number;
	/**
	 * Adjusts top and bottom margins.
	 */
	my?: number;
	/**
	 * Adjusts left and right margins.
	 */
	mx?: number;
	/**
	 * Adjusts top margins.
	 */
	mt?: number;
	/**
	 * Adjusts bottom margins.
	 *
	 * @default 2
	 */
	mb?: number;
	/**
	 * Adjusts left margins.
	 */
	ml?: number;
	/**
	 * Adjusts right margins.
	 */
	mr?: number;
	/**
	 * Adjusts all padding.
	 */
	p?: number;
	/**
	 * Adjusts top and bottom padding.
	 */
	py?: number;
	/**
	 * Adjusts left and right padding.
	 */
	px?: number;
	/**
	 * Adjusts top padding.
	 */
	pt?: number;
	/**
	 * Adjusts bottom padding.
	 */
	pb?: number;
	/**
	 * Adjusts left padding.
	 */
	pl?: number;
	/**
	 * Adjusts right padding.
	 */
	pr?: number;
}

export function useSpacer( props: ViewOwnProps< SpacerProps, 'div' > ) {
	const {
		className,
		m,
		mb = 2,
		ml,
		mr,
		mt,
		mx,
		my,
		p,
		pb,
		pl,
		pr,
		pt,
		px,
		py,
		...otherProps
	} = useContextSystem( props, 'Spacer' );

	const classes = cx(
		isDefined( mt ) &&
			css`
				margin-top: ${ space( mt ) };
			`,
		isDefined( mb ) &&
			css`
				margin-bottom: ${ space( mb ) };
			`,
		isDefined( ml ) &&
			css`
				margin-left: ${ space( ml ) };
			`,
		isDefined( mr ) &&
			css`
				margin-right: ${ space( mr ) };
			`,
		isDefined( mx ) &&
			css`
				margin-left: ${ space( mx ) };
				margin-right: ${ space( mx ) };
			`,
		isDefined( my ) &&
			css`
				margin-bottom: ${ space( my ) };
				margin-top: ${ space( my ) };
			`,
		isDefined( m ) &&
			css`
				margin: ${ space( m ) };
			`,
		isDefined( pt ) &&
			css`
				padding-top: ${ space( pt ) };
			`,
		isDefined( pb ) &&
			css`
				padding-bottom: ${ space( pb ) };
			`,
		isDefined( pl ) &&
			css`
				padding-left: ${ space( pl ) };
			`,
		isDefined( pr ) &&
			css`
				padding-right: ${ space( pr ) };
			`,
		isDefined( px ) &&
			css`
				padding-left: ${ space( px ) };
				padding-right: ${ space( px ) };
			`,
		isDefined( py ) &&
			css`
				padding-bottom: ${ space( py ) };
				padding-top: ${ space( py ) };
			`,
		isDefined( p ) &&
			css`
				padding: ${ space( p ) };
			`,
		className
	);

	return { ...otherProps, className: classes };
}
