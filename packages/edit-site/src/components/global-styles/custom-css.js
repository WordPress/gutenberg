/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext, createPortal, useState } from '@wordpress/element';
import { TextareaControl, Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { BlockList } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

function CustomCSSControl() {
	const [ updatedCSS, updateCSS ] = useState();
	const customCSS = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		return getEntityRecord( 'postType', 'custom_css' )?.post_content;
	} );

	const { saveEntityRecord } = useDispatch( coreStore );

	function updateCustomCSS() {
		saveEntityRecord( 'postType', 'custom_css', {
			custom_css: updatedCSS,
		} );
	}

	return (
		<>
			<TextareaControl
				value={ updatedCSS || customCSS }
				onChange={ ( value ) => updateCSS( value ) }
			/>
			<Button
				isPrimary
				onClick={ () => updateCustomCSS() }
				label={ __( 'Update' ) }
			>
				{ __( 'Update' ) }
			</Button>
		</>
	);
}

export default CustomCSSControl;

/**
 * Override the default block element to include custom CSS.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
const withCustomCSS = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		/*
		if ( ! customCSS ) {
			return <BlockListBlock { ...props } />;
		}
		*/
		const id = `wp-custom-css-test`;
		const className = classnames( props?.className, id );
		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ element &&
					createPortal( <style>{ __( ' *{}' ) }</style>, element ) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withCustomCSS'
);

addFilter(
	'editor.BlockListBlock',
	'core/editor/custom-css/with-customcss',
	withCustomCSS
);
