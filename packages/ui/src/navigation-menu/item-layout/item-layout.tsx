import { Children, cloneElement, isValidElement } from '@wordpress/element';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
} from '../../utils/keyboard-shortcut';
import { ItemLabel } from './item-label';
import styles from './style.module.css';
import type { InternalItemLayoutProps } from './types';

export function ItemLayout( {
	children,
	labelTrailing,
	prefix,
	shortcut,
	shortcutDescriptionId,
	suffix,
	trailing,
}: InternalItemLayoutProps ) {
	const hasPrefix = Children.toArray( prefix ).some(
		( child ) => child !== ''
	);
	const hasSuffix = Children.toArray( suffix ).some(
		( child ) => child !== ''
	);
	const hasTrailing = Children.toArray( trailing ).some(
		( child ) => child !== ''
	);
	const itemChildren = Children.map( children, ( child ) => {
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
						{ labelTrailing && <> { labelTrailing }</> }
					</>
				),
			} );
		}

		return child;
	} );

	return (
		<>
			{ hasPrefix && (
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
				{ hasSuffix && (
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
						<KeyboardShortcutDisplay shortcut={ shortcut } />
					</span>
				) }
				{ hasTrailing && (
					<span
						className={ styles[ 'item-trailing' ] }
						data-wp-ui-item-layout-muted=""
					>
						{ trailing }
					</span>
				) }
			</span>
			{ shortcut && shortcutDescriptionId && (
				<KeyboardShortcutDescription
					descriptionId={ shortcutDescriptionId }
					shortcut={ shortcut }
				/>
			) }
		</>
	);
}
