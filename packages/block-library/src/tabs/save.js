/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { innerTabs } = attributes;
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( {
		className: 'wp-block-tabs__content',
	} );

	return (
		<div
			{ ...blockProps }
			data-wp-interactive="core/tabs"
			data-wp-context='{ "activeTab": 0 }'
		>
			<ul className="wp-block-tabs__list" role="tablist">
				{ innerTabs.map( ( tab, index ) => {
					const isActive = index === 0;
					const tabIndexAttr = isActive ? 0 : -1;
					const tabLabelId = tab.id + '--tab';
					return (
						<li
							className="wp-block-tabs__list-item"
							key={ index }
							role="presentation"
						>
							<RichText.Content
								aria-controls={ tab.id }
								data-wp-bind--aria-selected={ `${ index } === context.activeTab` }
								data-wp-class--is-active={ `${ index } === context.activeTab` }
								data-wp-on--click={ `actions.setActiveTab.bind( null, ${ index } )` }
								className={ clsx( 'wp-block-tabs__tab-label', {
									'is-active': isActive,
								} ) }
								href={ '#' + tab.id }
								id={ tabLabelId }
								role="tab"
								tab-index={ tabIndexAttr }
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
