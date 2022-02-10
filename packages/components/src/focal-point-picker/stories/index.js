/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import FocalPointPicker from '../';

export default {
	title: 'Components/FocalPointPicker',
	component: FocalPointPicker,
};

const Example = ( props ) => {
	const [ focalPoint, setFocalPoint ] = useState( {
		x: 0.5,
		y: 0.5,
	} );

	return (
		<FocalPointPicker
			value={ focalPoint }
			onChange={ setFocalPoint }
			{ ...props }
		/>
	);
};

export const _default = () => {
	return <Example />;
};

export const image = () => {
	const url =
		'https://i0.wp.com/themes.svn.wordpress.org/twentytwenty/1.3/screenshot.png?w=572&strip=al';

	return <Example url={ url } />;
};

export const video = () => {
	const url =
		'https://interactive-examples.mdn.mozilla.net/media/examples/flower.webm';

	return <Example url={ url } />;
};

export const snapping = () => {
	const snapValues = {
		x: [ 0, 0.33, 0.66, 1 ],
		y: [ 0, 0.33, 0.66, 1 ],
	};

	const threshold = 0.05;

	const maybeSnapFocalPoint = ( value ) => {
		let x = parseFloat( value.x );
		let y = parseFloat( value.y );

		snapValues.x.forEach( ( snapValue ) => {
			if ( snapValue - threshold < x && x < snapValue + threshold ) {
				x = snapValue;
			}
		} );

		snapValues.y.forEach( ( snapValue ) => {
			if ( snapValue - threshold < y && y < snapValue + threshold ) {
				y = snapValue;
			}
		} );

		return { x, y };
	};

	return <Example resolvePoint={ maybeSnapFocalPoint } />;
};
