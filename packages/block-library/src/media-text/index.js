/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	getColorClassName,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit from './edit';

const DEFAULT_MEDIA_WIDTH = 50;

export const name = 'core/media-text';

export const settings = {
	title: __( 'Media & Text' ),

	icon: <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 17h8v-2h-8v2zM3 19h8V5H3v14zM13 9h8V7h-8v2zm0 4h8v-2h-8v2z" /></svg>,

	category: 'layout',

	keywords: [ __( 'image' ), __( 'video' ), __( 'half' ) ],

	attributes: {
		align: {
			type: 'string',
			default: 'wide',
		},
		backgroundColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		mediaAlt: {
			type: 'string',
			source: 'attribute',
			selector: 'figure img',
			attribute: 'alt',
			default: '',
		},
		mediaPosition: {
			type: 'string',
			default: 'left',
		},
		mediaId: {
			type: 'number',
		},
		mediaUrl: {
			type: 'string',
			source: 'attribute',
			selector: 'figure video,figure img',
			attribute: 'src',
		},
		mediaType: {
			type: 'string',
		},
		mediaWidth: {
			type: 'number',
			default: 50,
		},
	},

	supports: {
		align: [ 'wide', 'full' ],
	},

	edit,

	save( { attributes } ) {
		const {
			backgroundColor,
			customBackgroundColor,
			mediaAlt,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
		} = attributes;
		const mediaTypeRenders = {
			image: () => <img src={ mediaUrl } alt={ mediaAlt } />,
			video: () => <video controls src={ mediaUrl } />,
		};

		const backgroundClass = getColorClassName( 'background-color', backgroundColor );
		const className = classnames( {
			'has-media-on-the-right': 'right' === mediaPosition,
			[ backgroundClass ]: backgroundClass,
		} );

		let gridTemplateColumns;
		if ( mediaWidth !== DEFAULT_MEDIA_WIDTH ) {
			gridTemplateColumns = 'right' === mediaPosition ? `auto ${ mediaWidth }%` : `${ mediaWidth }% auto`;
		}
		const style = {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
			gridTemplateColumns,
		};
		return (
			<div className={ className } style={ style }>
				<figure className="wp-block-media-text__media" >
					{ ( mediaTypeRenders[ mediaType ] || noop )() }
				</figure>
				<div className="wp-block-media-text__content">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},
};
