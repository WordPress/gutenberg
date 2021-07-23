/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import CONFIG from './config-values';

const animationProps = {
	transitionDuration: CONFIG.transitionDuration,
	transitionProperty: 'all',
	transitionTimingFunction: 'ease-in-out',
} as const;

export const animation = ( transition: CSSProperties[ 'transition' ] ) => {
	return css( { transition } );
};

animation.default = css( {
	...animationProps,
	transitionTimingFunction: 'ease',
} );

animation.bounce = css( {
	...animationProps,
	transitionTimingFunction: 'cubic-bezier(.8, .5, .2, 1.4)',
} );

animation.delay = ( value: number ) =>
	css( {
		transitionDelay: `${ value }s`,
	} );

animation.duration = ( value: number ) =>
	css( {
		transitionDuration: `${ value }s`,
	} );

animation.ease = css( {
	...animationProps,
	transitionTimingFunction: 'ease',
} );

animation.easeIn = css( {
	...animationProps,
	transitionTimingFunction: 'ease-in',
} );

animation.easeInOut = css( {
	...animationProps,
	transitionTimingFunction: 'ease-in-out',
} );

animation.easeOut = css( {
	...animationProps,
	transitionTimingFunction: 'ease-out',
} );

animation.easing = ( value: CSSProperties[ 'transitionTimingFunction' ] ) =>
	css( {
		...animationProps,
		transitionTimingFunction: value,
	} );

animation.linear = css( {
	...animationProps,
	transitionTimingFunction: 'linear',
} );
