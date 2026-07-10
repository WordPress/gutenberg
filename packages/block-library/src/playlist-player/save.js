/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { waveformColor } = attributes;

	return (
		<div
			{ ...useBlockProps.save( {
				className: 'wp-block-playlist__waveform-player',
				style: waveformColor
					? { '--wp--playlist-player--waveform-color': waveformColor }
					: undefined,
			} ) }
		/>
	);
}
