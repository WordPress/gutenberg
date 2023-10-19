/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, BaseControl } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

export default function CategorySelector( {
	onChange,
	isCategorySelected,
	categoryOptions,
	showLabel = true,
} ) {
	const renderTerms = ( renderedTerms ) => {
		return renderedTerms.map( ( category ) => {
			return (
				<div
					key={ category.id }
					className="patterns-category-selector__terms-choice"
				>
					<CheckboxControl
						__nextHasNoMarginBottom
						checked={ isCategorySelected( category ) }
						onChange={ () => onChange( category ) }
						label={ decodeEntities( category.label ) }
					/>
				</div>
			);
		} );
	};

	return (
		<BaseControl>
			{ showLabel && (
				<BaseControl.VisualLabel>
					{ __( 'Categories' ) }
				</BaseControl.VisualLabel>
			) }
			<div
				className="patterns-category-selector__terms-list"
				tabIndex="0"
				role="group"
				aria-label={ __( 'Categories' ) }
			>
				{ renderTerms( categoryOptions ) }
			</div>
		</BaseControl>
	);
}
