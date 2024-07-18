/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit( { context } ) {
	console.log( context );
	const isActive = context[ 'tabs/activeTab' ];
	return (
		<div
			{ ...useBlockProps( {
				className: isActive ? 'is-active' : '',
			} ) }
		>
			<InnerBlocks
				defaultBlock={ [
					'core/paragraph',
					{ placeholder: __( 'Enter tab content…' ) },
				] }
				directInsert
			/>
		</div>
	);
}
