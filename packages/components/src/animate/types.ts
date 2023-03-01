/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * The animation types
 */
export type AppearAnimationType = 'appear';
export type SliteInAnimationType = 'slide-in';
export type LoadingAnimationType = 'loading';
export type AnimateType =
	| AppearAnimationType
	| SliteInAnimationType
	| LoadingAnimationType;

/**
 * The animation Origins
 */
export type AppearOrigin =
	| 'top'
	| 'top left'
	| 'top right'
	| 'middle'
	| 'middle left'
	| 'middle right'
	| 'bottom'
	| 'bottom left'
	| 'bottom right';
export type SlideInOrigin = 'left' | 'right';

/**
 * The options of the animation for the type='apper'
 */
export type AppearOptions = {
	type: AppearAnimationType;
	options: {
		origin: AppearOrigin;
	};
};
/**
 * The options of the animation for the type='slide-in'
 */
export type SlideInOptions = {
	type: SliteInAnimationType;
	options: {
		origin: SlideInOrigin;
	};
};
/**
 * The options of the animation for the type='loading'
 */
export type LoadingOptions = {
	type: LoadingAnimationType;
};

/**
 * The animate options
 */
export type AnimateOptions =
	| {
			type: LoadingAnimationType;
	  }
	| {
			type: SliteInAnimationType;
			origin: SlideInOrigin;
	  }
	| {
			type: AppearAnimationType;
			origin: AppearOrigin;
	  };

/**
 * Component type for Animate
 */
export type AnimateProps = (
	| SlideInOptions
	| AppearOptions
	| LoadingOptions
 ) & {
	children: ( props: { className?: string } ) => ReactNode;
};
