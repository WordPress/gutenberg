/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
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
	const arrowControls = [
		{
			value: '',
			label: _x( 'None', 'Arrow option for Query Pagination Next block' ),
		},
		{
			value: isRTL() ? '←' : '→',
			label: _x(
				'Arrow',
				'Arrow option for Query Pagination Next block'
			),
		},
		{
			value: isRTL() ? '«' : '»',
			label: _x(
				'Chevron',
				'Arrow option for Query Pagination Next block'
			),
		},
	];

	let selectedArrow = arrowControls.filter(
		( arrowControl ) => arrowControl.value === arrow
	);

	// This can happen if the user switches from an LTR to RTL
	if ( selectedArrow.length === 0 ) {
		selectedArrow = arrowControls[ 0 ];
		setAttributes( {
			arrow: '',
		} );
	} else {
		selectedArrow = selectedArrow[ 0 ];
	}

	return (
		<div className="wp-block-query-pagination-next">
			<InspectorControls>
				<PanelBody title={ __( 'Arrow settings' ) }>
					<SegmentedControl
						label={ selectedArrow.label }
						value={ arrow }
						onChange={ ( value ) => {
							setAttributes( {
								arrow: value,
							} );
						} }
						isBlock
					>
						{ arrowControls.map( ( arrowControl ) => {
							return (
								<SegmentedControlOption
									key={ arrowControl.value }
									value={ arrowControl.value }
									label={ arrowControl.label }
								/>
							);
						} ) }
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
			{ arrow }
		</div>
	);
}
