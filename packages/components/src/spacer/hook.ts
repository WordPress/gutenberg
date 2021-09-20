/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { space } from '../ui/utils/space';
import { useCx } from '../utils/hooks/use-cx';
import type { Props } from './types';

const isDefined = < T >( o: T ): o is Exclude< T, null | undefined > =>
	typeof o !== 'undefined' && o !== null;

export function useSpacer( props: WordPressComponentProps< Props, 'div' > ) {
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
		isDefined( margin ) &&
			css`
				margin: ${ space( margin ) };
			`,
		isDefined( marginY ) &&
			css`
				margin-bottom: ${ space( marginY ) };
				margin-top: ${ space( marginY ) };
			`,
		isDefined( marginX ) &&
			css`
				margin-left: ${ space( marginX ) };
				margin-right: ${ space( marginX ) };
			`,
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
		isDefined( padding ) &&
			css`
				padding: ${ space( padding ) };
			`,
		isDefined( paddingY ) &&
			css`
				padding-bottom: ${ space( paddingY ) };
				padding-top: ${ space( paddingY ) };
			`,
		isDefined( paddingX ) &&
			css`
				padding-left: ${ space( paddingX ) };
				padding-right: ${ space( paddingX ) };
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
		className
	);

	return { ...otherProps, className: classes };
}
