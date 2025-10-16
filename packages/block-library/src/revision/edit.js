/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl, RangeControl } from '@wordpress/components';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

const RevisionEdit = ( { attributes, context, setAttributes } ) => {
	const { postId, postType } = context;
	const { showTotalCount, showRevisionHistory, revisionLimit } = attributes;
	const blockProps = useBlockProps();

	const { supportsRevision } = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );

			return {
				supportsRevision:
					getPostType( postType )?.supports?.revisions ?? false,
			};
		},
		[ postType ]
	);

	if ( ! supportsRevision ) {
		return (
			<div { ...blockProps }>
				{ sprintf(
					// translators: %s: Name of the post type e.g: "post".
					__( 'This post type (%s) does not support the revisions.' ),
					postType
				) }
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title="Revisions Block Settings">
					<p>
						{ sprintf(
							// translators: %s: Id of the post type e.g: "100".
							__( 'Displaying revisions for Post ID: %s' ),
							postId
						) }
					</p>
					<ToggleControl
						label={ __( 'Show Total Revision Count' ) }
						checked={ showTotalCount }
						onChange={ () =>
							setAttributes( {
								showTotalCount: ! showTotalCount,
							} )
						}
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show Revision History' ) }
						checked={ showRevisionHistory }
						onChange={ () =>
							setAttributes( {
								showRevisionHistory: ! showRevisionHistory,
							} )
						}
						__nextHasNoMarginBottom
					/>
					{ showRevisionHistory && (
						<RangeControl
							label={ __( 'Number of Revisions to Display' ) }
							value={ revisionLimit }
							onChange={ ( value ) =>
								setAttributes( { revisionLimit: value } )
							}
							min={ 1 }
							max={ 20 }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div className="revisions-list">
				{ showTotalCount && <p>{ __( 'Total Revisions: Count' ) }</p> }
				{ showRevisionHistory && (
					<>
						{ __( 'Revision logs :' ) }
						<ul>
							<li>
								<strong>{ __( 'Author' ) }</strong>
								&nbsp;{ __( '- dd/mm/yy, hh:mm:ss' ) }
							</li>
						</ul>
					</>
				) }
			</div>
		</div>
	);
};

export default RevisionEdit;
