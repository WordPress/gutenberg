import { Children, cloneElement, isValidElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '../../visually-hidden';
import { ItemLabel } from './item-label';
import styles from './style.module.css';
import type { InternalItemLayoutProps } from './types';
import { getStructuredItemContent } from './use-item-content';

export function ItemLayout( {
	children,
	labelTrailing,
	prefix,
	selectionIndicator,
	shortcut,
	shortcutDescriptionId,
	suffix,
	trailing,
}: InternalItemLayoutProps ) {
	const hasStructuredContent =
		getStructuredItemContent( children ).hasStructuredContent;
	const itemChildren = hasStructuredContent ? (
		Children.map( children, ( child ) => {
			if (
				isValidElement< {
					children?: InternalItemLayoutProps[ 'children' ];
				} >( child ) &&
				child.type === ItemLabel
			) {
				return cloneElement( child, {
					children: (
						<>
							{ child.props.children }
							{ labelTrailing }
						</>
					),
				} );
			}

			return child;
		} )
	) : (
		<ItemLabel>
			{ children }
			{ labelTrailing }
		</ItemLabel>
	);

	return (
		<>
			{ selectionIndicator && (
				<span
					className={ styles[ 'item-selection-indicator' ] }
					data-wp-ui-item-layout-selection=""
					data-wp-ui-item-layout-muted=""
				>
					{ selectionIndicator }
				</span>
			) }
			{ prefix && (
				<span
					className={ styles[ 'item-prefix' ] }
					data-wp-ui-item-layout-prefix=""
					data-wp-ui-item-layout-muted=""
				>
					{ prefix }
				</span>
			) }
			<span className={ styles[ 'item-content' ] }>
				<span className={ styles[ 'item-children' ] }>
					{ itemChildren }
				</span>
				{ suffix && (
					<span
						className={ styles[ 'item-suffix' ] }
						data-wp-ui-item-layout-muted=""
					>
						{ suffix }
					</span>
				) }
				{ shortcut && (
					<span
						className={ styles[ 'item-shortcut' ] }
						data-wp-ui-item-layout-muted=""
						aria-hidden="true"
					>
						{ shortcut.displayShortcut }
					</span>
				) }
				{ trailing && (
					<span
						className={ styles[ 'item-trailing' ] }
						data-wp-ui-item-layout-muted=""
					>
						{ trailing }
					</span>
				) }
			</span>
			{ shortcut && shortcutDescriptionId && (
				<VisuallyHidden
					id={ shortcutDescriptionId }
					render={ <span /> }
				>
					{ sprintf(
						/* translators: %s: human-readable keyboard shortcut. */
						__( 'Keyboard shortcut: %s' ),
						shortcut.description
					) }
				</VisuallyHidden>
			) }
		</>
	);
}
