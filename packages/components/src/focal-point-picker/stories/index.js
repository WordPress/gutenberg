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
