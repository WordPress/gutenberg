/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import styles from './styles.module.css';

const blocks = [
	{
		title: 'Paragraph',
		img: require( '@site/static/img/paragraph.png' ).default,
	},
	{
		title: 'Heading',
		img: require( '@site/static/img/heading.png' ).default,
	},
	{
		title: 'Media & Text',
		img: require( '@site/static/img/media-text.png' ).default,
	},
	{
		title: 'Image',
		img: require( '@site/static/img/image.png' ).default,
	},
	{
		title: 'Cover',
		img: require( '@site/static/img/cover.png' ).default,
	},
	{
		title: 'Gallery',
		img: require( '@site/static/img/gallery.png' ).default,
	},
	{
		title: 'Video',
		img: require( '@site/static/img/video.png' ).default,
	},
	{
		title: 'Audio',
		img: require( '@site/static/img/audio.png' ).default,
	},
	{
		title: 'Columns',
		img: require( '@site/static/img/columns.png' ).default,
	},
	{
		title: 'File',
		img: require( '@site/static/img/file.png' ).default,
	},
	{
		title: 'Code',
		img: require( '@site/static/img/code.png' ).default,
	},
	{
		title: 'List',
		img: require( '@site/static/img/list.png' ).default,
	},
];

function Block( { img, title } ) {
	return (
		<div className={ styles.block }>
			<div>
				<img className={ styles.image } src={ img } alt={ title } />
			</div>
			<h3 className={ styles.blockTitle }>{ title }</h3>
		</div>
	);
}

export default function HomepageBlocks() {
	return (
		<section className={ styles.blocks }>
			<div className={ clsx( 'container', styles.titleContainer ) }>
				<h2 className={ styles.title }>Be your own builder.</h2>
				<p className={ styles.description }>
					Blocks allow users to build their own content without any
					coding knowledge. Here’s a selection of the default blocks
					included with Gutenberg:
				</p>
			</div>
			<div className={ clsx( 'container', styles.grid ) }>
				{ blocks.map( ( props, idx ) => (
					<Block key={ idx } { ...props } />
				) ) }
			</div>
		</section>
	);
}
