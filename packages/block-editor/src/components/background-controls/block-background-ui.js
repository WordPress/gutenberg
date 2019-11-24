/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	IMAGE_BACKGROUND_TYPE,
	VIDEO_BACKGROUND_TYPE,
	backgroundImageStyles,
	dimRatioToClass,
} from './shared';
import ResizableArea from './resizable-area';
import useCoverIsDark from './use-cover-is-dark';

export default function BlockBackgroundUi( {
	className,
	children,
	attributes,
	isSelected,
	toggleSelection,
	setAttributes,
	overlayColor,
	gradientValue,
	temporaryMinHeight,
	setTemporaryMinHeight,
	gradientClass,
} ) {
	const {
		backgroundType,
		dimRatio,
		focalPoint,
		minHeight,
		hasParallax,
		url,
	} = attributes;

	const style = {
		...(
			backgroundType === IMAGE_BACKGROUND_TYPE ?
				backgroundImageStyles( url ) :
				{}
		),
		backgroundColor: overlayColor,
		minHeight: ( temporaryMinHeight || minHeight ),
	};

	if ( gradientValue && ! url ) {
		style.background = gradientValue;
	}

	if ( focalPoint ) {
		style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
	}

	const isDarkElement = useRef();
	const isDark = useCoverIsDark( url, dimRatio, overlayColor, isDarkElement );

	const classes = classnames(
		className,
		dimRatioToClass( dimRatio ),
		{
			'is-dark-theme': isDark,
			'has-background-dim': dimRatio !== 0,
			'has-parallax': hasParallax,
			// [ overlayColor.class ]: overlayColor.class, // @TODO fix
			'has-background-gradient': gradientValue,
			[ gradientClass ]: ! url && gradientClass,
		}
	);

	return (
		<ResizableArea
			className={ classnames(
				'block-library-cover__resize-container',
				{ 'is-selected': isSelected },
			) }
			onResizeStart={ () => toggleSelection( false ) }
			onResize={ setTemporaryMinHeight }
			onResizeStop={
				( newMinHeight ) => {
					toggleSelection( true );
					setAttributes( { minHeight: newMinHeight } );
					setTemporaryMinHeight( null );
				}
			}
		>
			<div
				data-url={ url }
				style={ style }
				className={ classes }
			>
				{ IMAGE_BACKGROUND_TYPE === backgroundType && (
				// Used only to programmatically check if the image is dark or not
					<img
						ref={ isDarkElement }
						aria-hidden
						alt=""
						style={ {
							display: 'none',
						} }
						src={ url }
					/>
				) }
				{ url && gradientValue && dimRatio !== 0 && (
					<span
						aria-hidden="true"
						className={ classnames(
							'wp-block-cover__gradient-background',
							gradientClass,
						) }
						style={ { background: gradientValue } }
					/>
				) }
				{ VIDEO_BACKGROUND_TYPE === backgroundType && (
					<video
						ref={ isDarkElement }
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/>
				) }
				{ children }
			</div>
		</ResizableArea>
	);
}
