/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	useBlockProps,
	PlainText,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import {
	arrowLeft,
	arrowRight,
	chevronLeft,
	chevronRight,
	textColor,
} from '@wordpress/icons';

export default function QueryPaginationNextEdit( {
	attributes: { label, arrow },
	setAttributes,
} ) {
	const arrowIcon = isRTL() ? arrowLeft : arrowRight;
	const arrowValue = isRTL() ? '←' : '→';
	const chevronIcon = isRTL() ? chevronLeft : chevronRight;
	const chevronValue = '⟩'; // chevrons seem to handle their own RTL.

	const arrowControls = [
		{
			icon: textColor,
			value: '',
			title: __( 'No arrow' ),
			isActive: '' === arrow,
			onClick: () => {
				setAttributes( {
					arrow: '',
				} );
			},
		},
		{
			icon: arrowIcon,
			value: arrowValue,
			title: __( 'Arrow' ),
			isActive: arrowValue === arrow,
			onClick: () => {
				setAttributes( {
					arrow: arrowValue,
				} );
			},
		},
		{
			icon: chevronIcon,
			value: chevronValue,
			title: __( 'Chevron' ),
			isActive: chevronValue === arrow,
			onClick: () => {
				setAttributes( {
					arrow: chevronValue,
				} );
			},
		},
	];

	const getIcon = () => {
		const currentArrow = arrowControls.filter(
			( arrowControl ) => arrowControl.value === arrow
		);
		if ( currentArrow.length > 0 ) {
			return currentArrow[ 0 ].icon;
		}

		return null;
	};

	return (
		<div className="wp-block-query-pagination-next">
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={ getIcon() }
						label={ __( 'Change arrow' ) }
						controls={ arrowControls }
					/>
				</ToolbarGroup>
			</BlockControls>
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
