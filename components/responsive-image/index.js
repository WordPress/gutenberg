/**
 * Internal dependencies
 */
import './style.scss';

function ResponsiveImage( { src, alt, naturalWidth, naturalHeight } ) {
	const imageStyle = {
		paddingBottom: ( naturalHeight / naturalWidth * 100 ) + '%',
	};
	return (
		<div className="components-responsive-image">
			<div style={ imageStyle } />
			<img src={ src } className="components-responsive-image__image" alt={ alt } />
		</div>
	);
}

export default ResponsiveImage;
