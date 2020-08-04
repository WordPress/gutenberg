/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	RichText,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { ToggleControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { SPACE } from '@wordpress/keycodes';

export default ( {
	attributes,
	className,
	clientId,
	isSelected,
	setAttributes,
} ) => {
	const summaryRef = useRef( null );

	useEffect( () => {
		if ( ! summaryRef.current ) {
			return;
		}

		const keyDownListener = ( e ) => {
			if ( e.keyCode === SPACE ) {
				e.preventDefault();
			}
		};

		const clickListener = ( e ) => e.preventDefault();

		summaryRef.current.addEventListener( 'keyup', keyDownListener );
		summaryRef.current.addEventListener( 'click', clickListener );
		return () => {
			summaryRef.current.removeEventListener( 'keyup', keyDownListener );
			summaryRef.current.removeEventListener( 'click', clickListener );
		};
	}, [ summaryRef.current ] );

	const isInnerBlockSelected = useSelect(
		( select ) =>
			select( 'core/block-editor' ).hasSelectedInnerBlock( clientId ),
		[ clientId ]
	);

	const showInnerBlocks =
		attributes.initialOpen || isSelected || isInnerBlockSelected;

	return (
		<>
			<InspectorControls>
				<ToggleControl
					label={ __( 'Open by default' ) }
					onChange={ ( initialOpen ) =>
						setAttributes( { initialOpen } )
					}
					checked={ attributes.initialOpen }
				/>
			</InspectorControls>
			<details className={ className } open={ showInnerBlocks }>
				<summary ref={ summaryRef }>
					<RichText
						value={ attributes.summaryContent }
						onChange={ ( summaryContent ) =>
							setAttributes( { summaryContent } )
						}
						placeholder={ __( 'Write a summary…' ) }
						aria-label={ __( 'Summary text' ) }
					/>
				</summary>
				<InnerBlocks />
			</details>
		</>
	);
};
