/**
 * External dependencies
 */
import { Image as RNImage, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useState } from '@wordpress/element';

export function Image( { src, alt, style, ...additionalProps }, ref ) {
	if ( ! src ) {
		return null;
	}

	const source = {
		uri: src,
	};

	const [ aspectRatio, setAspectRatio ] = useState();
    useEffect( () => {
        RNImage.getSize( src, ( width, height ) => {
            setAspectRatio( width / height );
        } );
	}, [ src, setAspectRatio ] );

	const containerStyle = {
		flex: 1,
		aspectRatio,
	};

	return (
		<View style={ [ containerStyle, style] }>
			<RNImage
				ref={ ref }
				accessibilityLabel={ alt }
				source={ source }
				style={ { flex: 1 } }
				{ ...additionalProps }
			/>
		</View>
	);
}

export default forwardRef( Image );
