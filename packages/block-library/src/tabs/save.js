/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { innerTabs } = attributes;
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( {
		className: 'wp-block-tabs__content',
	} );

	return (
		<div { ...blockProps }>
			{ /* translators: Title for a list of content sections linked below. */ }
			<h3 className="wp-block-tabs__title">{ __( 'Contents' ) }</h3>
			<ul className="wp-block-tabs__list">
				{ innerTabs.map( ( tab, index ) => {
					const tabId = tab.href.replace( '#', '' ) + '--tab';
					return (
						<li className="wp-block-tabs__list-item" key={ index }>
							<RichText.Content
								id={ tabId }
								className="wp-block-tabs__tab-label"
								href={ tab.href }
								tagName="a"
								value={ tab.label }
							/>
						</li>
					);
				} ) }
			</ul>

			<div { ...innerBlocksProps }></div>
		</div>
	);
}
