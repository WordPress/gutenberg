/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaUploadCheck,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps
} from '@wordpress/block-editor';
import {
	useRef,
	useEffect
} from '@wordpress/element';
import {
	useRefEffect
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Panzoom from '@panzoom/panzoom';

const Edit = (props) => {

	const blockProps = useBlockProps();
	//const ref = useRef();
	const {
		attributes: { url, id, alt },
		setAttributes,
	} = props;

	const setImage = (media) => {
		setAttributes({
			url: media.url,
			id: media.id,
			alt: media.alt
		});
	};

	/*useEffect( () => {
		if ( ref.current ) {
			// The Panzoom constructor is called when a new block is added and an image is selected/replaced.
			var panzoom = Panzoom(ref.current, {
				minScale: 1.1,
				maxScale: 5,
				startScale: 1.1,
				animate: true,
				duration: 1000,
				origin: '50% 0'
			});

			var zoomInButton = ref.current.parentElement.querySelector('.zoomin-button');
			var zoomOutButton = ref.current.parentElement.querySelector('.zoomout-button');

			zoomInButton.addEventListener('click', panzoom.zoomIn);
			zoomOutButton.addEventListener('click', panzoom.zoomOut);

			ref.current.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);
		}

		return () => {
			if (panzoom) {
				// Destroy Panzoom instance after every render.
				panzoom.destroy();
			}
		}

	}, [url]);*/

	const ref = useRefEffect((element) => {
		// The Panzoom constructor is called when a new block is added and an image is selected/replaced.
		var panzoom = Panzoom(element, {
			minScale: 1.1,
			maxScale: 5,
			startScale: 1.1,
			animate: true,
			duration: 1000,
			origin: '50% 0'
		});

		var zoomInButton = element.parentElement.querySelector('.zoomin-button');
		var zoomOutButton = element.parentElement.querySelector('.zoomout-button');

		zoomInButton.addEventListener('click', panzoom.zoomIn);
		zoomOutButton.addEventListener('click', panzoom.zoomOut);

		element.parentElement.addEventListener('wheel', function (e) {
			if (!e.ctrlKey) return
			panzoom.zoomWithWheel(e)
		});

		return () => {
			if (panzoom) {
				// Destroy Panzoom instance after every render.
				panzoom.destroy();
			}
		}

	}, [url]);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Settings', 'rather-simple-panzoom')}
				>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<MediaReplaceFlow
					mediaId={id}
					mediaUrl={url}
					allowedTypes={['image']}
					accept="image/*"
					onSelect={setImage}
					name={!url ? __('Add Image', 'rather-simple-panzoom') : __('Replace Image', 'rather-simple-panzoom')}
				/>
			</BlockControls>
			<MediaUploadCheck>
				{url ?
					<div {...blockProps}>
						<div className="panzoom-parent">
							<div className="panzoom-element" ref={ref}>
								<img
									className={`wp-image-${id}`}
									src={url}
									alt={alt}
								/>
							</div>
							<div className="panzoom-buttons">
								<button className="zoomin-button">
									<span className="screen-reader-text">{__('Zoom In', 'rather-simple-panzoom')}</span>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
								</button>
								<button className="zoomout-button">
									<span className="screen-reader-text">{__('Zoom Out', 'rather-simple-panzoom')}</span>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,13H5V11H19V13Z" /></svg>
								</button>
							</div>
						</div>
					</div>
					:
					<div {...blockProps}>
						<MediaPlaceholder
							accept="image/*"
							allowedTypes={['image']}
							onSelect={setImage}
							value={id}
							multiple={false}
							handleUpload={true}
							labels={
								{ title: __('Panzoom Image', 'rather-simple-panzoom') }
							}
						/>
					</div>
				}
			</MediaUploadCheck>
		</>
	);

}

export default Edit;

