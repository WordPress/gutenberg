/**
 * WordPress dependencies
 */
import { __experimentalSearchForm as SearchForm } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import TemplatePartPreviews from './template-part-previews';

export default function TemplatePartSelection( { setAttributes, onClose } ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	return (
		<>
			<SearchForm
				value={ filterValue }
				onChange={ setFilterValue }
				className="wp-block-template-part__selection-preview-search-form"
			/>
			<div className="wp-block-template-part__selection-preview-container">
				<TemplatePartPreviews
					setAttributes={ setAttributes }
					filterValue={ filterValue }
					onClose={ onClose }
				/>
			</div>
		</>
	);
}
