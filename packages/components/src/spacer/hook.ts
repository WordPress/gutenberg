/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { space } from '../utils/space';
import { rtl, useCx } from '../utils';
import type { SpacerProps } from './types';

function isDefined< T >( o: T ): o is Exclude< T, null | undefined > {
	return typeof o !== 'undefined' && o !== null;
}

export function useSpacer(
	props: WordPressComponentProps< SpacerProps, 'div' >
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
			rtl( {
				marginLeft: space( marginLeft ),
			} )(),
		isDefined( marginRight ) &&
			rtl( {
				marginRight: space( marginRight ),
			} )(),
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
			rtl( {
				paddingLeft: space( paddingLeft ),
			} )(),
		isDefined( paddingRight ) &&
			rtl( {
				paddingRight: space( paddingRight ),
			} )(),
		className
	);

	return { ...otherProps, className: classes };
}
