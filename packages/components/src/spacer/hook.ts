import clsx from 'clsx';
import type { CSSProperties } from 'react';

import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { space } from '../utils/space';
import type { SpacerProps } from './types';
import styles from './style.module.scss';

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
		style,
		...otherProps
	} = useContextSystem( props, 'Spacer' );

	const spacingStyle: CSSProperties = {};

	if ( isDefined( margin ) ) {
		spacingStyle[ '--wp-components-spacer-margin' ] = space( margin );
	}

	if ( isDefined( marginY ) ) {
		spacingStyle[ '--wp-components-spacer-margin-block-start' ] =
			space( marginY );
		spacingStyle[ '--wp-components-spacer-margin-block-end' ] =
			space( marginY );
	}

	if ( isDefined( marginX ) ) {
		spacingStyle[ '--wp-components-spacer-margin-inline-start' ] =
			space( marginX );
		spacingStyle[ '--wp-components-spacer-margin-inline-end' ] =
			space( marginX );
	}

	if ( isDefined( marginTop ) ) {
		spacingStyle[ '--wp-components-spacer-margin-block-start' ] =
			space( marginTop );
	}

	if ( isDefined( marginBottom ) ) {
		spacingStyle[ '--wp-components-spacer-margin-block-end' ] =
			space( marginBottom );
	}

	if ( isDefined( marginLeft ) ) {
		spacingStyle[ '--wp-components-spacer-margin-inline-start' ] =
			space( marginLeft );
	}

	if ( isDefined( marginRight ) ) {
		spacingStyle[ '--wp-components-spacer-margin-inline-end' ] =
			space( marginRight );
	}

	if ( isDefined( padding ) ) {
		spacingStyle[ '--wp-components-spacer-padding' ] = space( padding );
	}

	if ( isDefined( paddingY ) ) {
		spacingStyle[ '--wp-components-spacer-padding-block-start' ] =
			space( paddingY );
		spacingStyle[ '--wp-components-spacer-padding-block-end' ] =
			space( paddingY );
	}

	if ( isDefined( paddingX ) ) {
		spacingStyle[ '--wp-components-spacer-padding-inline-start' ] =
			space( paddingX );
		spacingStyle[ '--wp-components-spacer-padding-inline-end' ] =
			space( paddingX );
	}

	if ( isDefined( paddingTop ) ) {
		spacingStyle[ '--wp-components-spacer-padding-block-start' ] =
			space( paddingTop );
	}

	if ( isDefined( paddingBottom ) ) {
		spacingStyle[ '--wp-components-spacer-padding-block-end' ] =
			space( paddingBottom );
	}

	if ( isDefined( paddingLeft ) ) {
		spacingStyle[ '--wp-components-spacer-padding-inline-start' ] =
			space( paddingLeft );
	}

	if ( isDefined( paddingRight ) ) {
		spacingStyle[ '--wp-components-spacer-padding-inline-end' ] =
			space( paddingRight );
	}

	const spacerStyle: CSSProperties = {
		...spacingStyle,
		...style,
	};

	return {
		...otherProps,
		className: clsx( styles.spacer, className ),
		style: spacerStyle,
	};
}
