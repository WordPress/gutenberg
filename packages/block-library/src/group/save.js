/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tagName: Tag, layout = {} } = attributes;
	const { contentSize, wideSize } = layout;
	const className = classnames( 'wp-block-group__inner-container', {
		[ `wp-container-${ layout.id }` ]: !! layout.id,
	} );

	return (
		<Tag { ...useBlockProps.save() }>
			{ ( contentSize || wideSize ) && (
				<style>
					{ `
							.wp-container-${ layout.id } > * {
								max-width: ${ contentSize ?? wideSize };
								margin-left: auto;
								margin-right: auto;
							}
						
							.wp-container-${ layout.id } > .alignwide {
								max-width: ${ wideSize ?? contentSize };
							}
						
							.wp-container-${ layout.id } > .alignfull {
								max-width: none;
							}
						` }
				</style>
			) }
			<div className={ className }>
				<InnerBlocks.Content />
			</div>
		</Tag>
	);
}
