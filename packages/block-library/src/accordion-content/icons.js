/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

export const plus = ( { width, height } ) => {
	return createElement(
		'span',
		{
			style: {
				display: 'inline-block',
				width: width || 24,
				height: height || 24,
				lineHeight: `${ height || 24 }px`,
				textAlign: 'center',
				fontSize: `${ ( height || 24 ) * 0.6 }px`,
				fontWeight: 'bold',
				color: 'currentColor',
			},
		},
		'+'
	);
};
