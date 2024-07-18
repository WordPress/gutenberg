/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import clsx from 'clsx';

export default function Edit( { attributes, clientId, setAttributes } ) {
	const { activeTab } = attributes;
	const innerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	const setActiveTab = ( index ) => {
		setAttributes( { activeTab: index } );
	};

	return (
		<div { ...useBlockProps() } data-wp-interactive="core/tabs">
			<div className="wp-block-tabs__tab-titles">
				{ innerBlocks.map( ( block, index ) => (
					<button
						key={ block.clientId }
						className={ `wp-block-tabs__tab-title ${
							index === activeTab ? 'is-active' : ''
						}` }
						onClick={ () => setActiveTab( index ) }
					>
						{ block.attributes.title }
					</button>
				) ) }
			</div>
			<div className="wp-block-tabs__tab-content">
				<InnerBlocks />
			</div>
		</div>
	);
}
