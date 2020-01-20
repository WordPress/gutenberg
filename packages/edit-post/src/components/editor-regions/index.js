/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSimulatedMediaQuery } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

function EditorRegions( { footer, header, sidebar, content, publish, className } ) {
	const resizableStylesheets = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().resizableStylesheets;
	}, [] );

	const deviceType = useSelect( ( select ) => {
		return select( 'core/block-editor' ).deviceType();
	} );

	const [ actualWidth, updateActualWidth ] = useState( window.innerWidth );

	window.addEventListener( 'resize', () => updateActualWidth( window.innerWidth ) );

	const canvasWidth = ( device ) => {
		let deviceWidth = 0;

		switch ( device ) {
			case 'Tablet':
				deviceWidth = 780;
				break;
			case 'Mobile':
				deviceWidth = 360;
				break;
			default:
				deviceWidth = 2000;
		}

		return deviceWidth < actualWidth ? deviceWidth : actualWidth;
	};

	const marginValue = () => window.innerHeight < 800 ? 36 : 72;

	const maxHeightValue = ( device ) => device === 'Mobile' ? 768 : 1024;

	const contentInlineStyles = ( device ) => {
		switch ( device ) {
			case 'Tablet':
			case 'Mobile':
				return {
					width: canvasWidth( device ),
					margin: marginValue() + 'px auto',
					flexGrow: 0,
					maxHeight: maxHeightValue( device ) + 'px',
				};
			default:
				return null;
		}
	};

	useSimulatedMediaQuery( resizableStylesheets, canvasWidth( deviceType ) );

	return (
		<div className={ classnames( className, 'edit-post-editor-regions' ) }>
			{ !! header && (
				<div
					className="edit-post-editor-regions__header"
					role="region"
					/* translators: accessibility text for the top bar landmark region. */
					aria-label={ __( 'Editor top bar' ) }
					tabIndex="-1"
				>
					{ header }
				</div>
			) }
			<div className="edit-post-editor-regions__body">
				<div
					className="edit-post-editor-regions__content"
					role="region"
					/* translators: accessibility text for the content landmark region. */
					aria-label={ __( 'Editor content' ) }
					tabIndex="-1"
					style={ contentInlineStyles( deviceType ) }
				>
					{ content }
				</div>
				{ !! sidebar && (
					<div
						className="edit-post-editor-regions__sidebar"
						role="region"
						/* translators: accessibility text for the settings landmark region. */
						aria-label={ __( 'Editor settings' ) }
						tabIndex="-1"
					>
						{ sidebar }
					</div>
				) }
				{ !! publish && (
					<div
						className="edit-post-editor-regions__publish"
						role="region"
						/* translators: accessibility text for the publish landmark region. */
						aria-label={ __( 'Editor publish' ) }
						tabIndex="-1"
					>
						{ publish }
					</div>
				) }
			</div>
			{ !! footer && (
				<div
					className="edit-post-editor-regions__footer"
					role="region"
					/* translators: accessibility text for the footer landmark region. */
					aria-label={ __( 'Editor footer' ) }
					tabIndex="-1"
				>
					{ footer }
				</div>
			) }
		</div>
	);
}

export default navigateRegions( EditorRegions );
