/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';

import { ToolbarButton } from '@wordpress/components';

import { edit } from '@wordpress/icons';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function Edit() {
	const [ isOpen, setIsOpen ] = React.useState( false );
	const blockProps = useBlockProps( {
		className: 'interactivity-api-accordion',
	} );
	const innerBlocksProps = useInnerBlocksProps();

	return (
		<div { ...blockProps }>
			<BlockControls group="block">
				<ToolbarButton
					icon={ edit }
					label={ isOpen ? 'Close' : 'Open' }
					onClick={ () => setIsOpen( ! isOpen ) }
				/>
			</BlockControls>
			<h3 className="interactivity-api-accordion-title">
				<RichText
					className="interactivity-api-accordion-title_action"
					tagName="button"
					value="Accordion Title"
				/>
			</h3>
			{ isOpen && <div { ...innerBlocksProps } /> }
		</div>
	);
}
