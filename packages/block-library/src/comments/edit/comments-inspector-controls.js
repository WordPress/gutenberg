/**
 * WordPress dependencies
 */
import {
	SelectControl,
	PanelBody,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

export default function CommentsInspectorControls( {
	attributes: { tagName, enhancedSubmission },
	setAttributes,
} ) {
	const htmlElementMessages = {
		section: __(
			"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
		),
		aside: __(
			"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
		),
	};

	const enhancedSubmissionNotice = __(
		'Enhanced submission might cause interactive blocks within the Comment Template to stop working. Disable it if you experience any issues.'
	);

	const isFirstRender = useRef( true ); // Don't speak on first render.
	useEffect( () => {
		if ( ! isFirstRender.current && enhancedSubmission ) {
			speak( enhancedSubmissionNotice );
		}
		isFirstRender.current = false;
	}, [ enhancedSubmission, enhancedSubmissionNotice ] );

	return (
		<>
			<InspectorControls group="advanced">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					help={ htmlElementMessages[ tagName ] }
				/>
			</InspectorControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'User Experience' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Enhanced form submission' ) }
						help={ __(
							'Submitted comments are added without refreshing the page.'
						) }
						checked={ !! enhancedSubmission }
						onChange={ ( value ) =>
							setAttributes( {
								enhancedSubmission: !! value,
							} )
						}
					/>
					{ enhancedSubmission && (
						<div>
							<Notice
								spokenMessage={ null }
								status="warning"
								isDismissible={ false }
							>
								{ enhancedSubmissionNotice }
							</Notice>
						</div>
					) }
				</PanelBody>
			</InspectorControls>
		</>
	);
}
