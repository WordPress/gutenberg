/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	useBlockProps,
	PlainText,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalSegmentedControl as SegmentedControl,
	__experimentalSegmentedControlOption as SegmentedControlOption,
} from '@wordpress/components';

export default function QueryPaginationNextEdit( {
	attributes: { label, arrow },
	setAttributes,
} ) {
	return (
		<div className="wp-block-query-pagination-next">
			<InspectorControls>
				<PanelBody title={ __( 'Arrow settings' ) }>
					<SegmentedControl
						label={ __(
							'A decorative arrow appended to the next page link.'
						) }
						value={ arrow }
						onChange={ ( value ) => {
							setAttributes( {
								arrow: value,
							} );
						} }
						isBlock
					>
						<SegmentedControlOption
							value=""
							label={ _x(
								'None',
								'Arrow option for Query Pagination Next block'
							) }
						/>
						<SegmentedControlOption
							value="→"
							label={ _x(
								'Arrow',
								'Arrow option for Query Pagination Next block'
							) }
						/>
						<SegmentedControlOption
							value="»"
							label={ _x(
								'Chevron',
								'Arrow option for Query Pagination Next block'
							) }
						/>
					</SegmentedControl>
				</PanelBody>
			</InspectorControls>
			<PlainText
				__experimentalVersion={ 2 }
				tagName="a"
				aria-label={ __( 'Next page link' ) }
				placeholder={ __( 'Next Page' ) }
				value={ label }
				onChange={ ( newLabel ) =>
					setAttributes( { label: newLabel } )
				}
				{ ...useBlockProps() }
			/>{ ' ' }
			<span
				className={ `wp-block-query-pagination-next-arrow has-arrow-$(arrow)` }
			>
				{ arrow }
			</span>
		</div>
	);
}
