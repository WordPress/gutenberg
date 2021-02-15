/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';
import saveV1 from './v1/save';

export default function save( { attributes } ) {
	if ( attributes?.ids?.length > 0 || attributes?.images?.length > 0 ) {
		return saveV1( { attributes } );
	}
	const {
		imageCount,
		caption,
		columns = defaultColumnsNumber( imageCount ),
		gutterSize,
		imageCrop,
	} = attributes;

	const className = `blocks-gallery-grid has-nested-images columns-${ columns } ${
		imageCrop ? 'is-cropped' : ''
	}`;

	const style = {
		'--gallery-block--gutter-size':
			gutterSize !== undefined ? `${ gutterSize }px` : undefined,
	};

	return (
		<figure { ...useBlockProps.save( { className, style } ) }>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					tagName="figcaption"
					className="blocks-gallery-caption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
