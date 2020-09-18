/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useColorExtract } from '../hooks';

export default { title: 'Utils/Hooks/useColorExtract' };

const Example = () => {
	const src =
		'https://i0.wp.com/themes.svn.wordpress.org/twentytwenty/1.5/screenshot.png?w=1144&strip=all';
	const { color, extractColor } = useColorExtract( { src } );

	useEffect( () => {
		extractColor();
	}, [] );

	return (
		<div>
			<h3>Extracted Color</h3>
			<p>
				<div
					style={ { width: 40, height: 40, backgroundColor: color } }
				/>
			</p>
			<h3>Image Source</h3>
			<img
				src={ src }
				alt="Twenty Twenty Theme Preview"
				style={ { width: 300, height: 'auto' } }
			/>
		</div>
	);
};

export const _default = () => {
	return <Example />;
};
