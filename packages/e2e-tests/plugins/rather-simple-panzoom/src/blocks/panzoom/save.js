/**
 * WordPress dependencies
 */
import {
	useBlockProps
} from '@wordpress/block-editor';

const Save = (props) => {

	const {
		attributes: { url, id, alt },
	} = props;
	const blockProps = useBlockProps.save();

	return (
		<div {...blockProps}>
			<div className="panzoom-parent">
				<div className="panzoom-element">
					<img
						className={`wp-image-${id}`}
						src={url}
						alt={alt}
					/>
				</div>
				<div className="panzoom-buttons">
					<button className="zoomin-button">
						<span className="screen-reader-text">Zoom In</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
					</button>
					<button className="zoomout-button">
						<span className="screen-reader-text">Zoom Out</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,13H5V11H19V13Z" /></svg>
					</button>
				</div>
			</div>
		</div>
	);

};

export default Save;