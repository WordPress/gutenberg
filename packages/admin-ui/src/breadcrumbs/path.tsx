import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from './style.module.css';

export interface BreadcrumbPathProps {
	/** Labels in ancestor order, from the root to the nearest parent. */
	items: { label: string }[];
}

/**
 * Renders a compact, non-interactive breadcrumb path without navigation or a heading.
 *
 * @param props
 * @param props.items Ancestor labels to display.
 */
export function BreadcrumbPath( { items }: BreadcrumbPathProps ) {
	if ( ! items.length ) {
		return null;
	}

	return (
		<div
			role="group"
			aria-label={ __( 'Breadcrumbs' ) }
			className={ styles.container }
		>
			<Stack
				render={ <ul /> }
				direction="row"
				align="center"
				className={ `${ styles.list } ${ styles.path }` }
			>
				{ items.map( ( item, index ) => (
					<li key={ index }>
						<Text variant="body-sm" render={ <span /> }>
							{ item.label }
						</Text>
						{ index < items.length - 1 && (
							<Text
								variant="body-sm"
								aria-hidden="true"
								className={ styles.separator }
							>
								/
							</Text>
						) }
					</li>
				) ) }
			</Stack>
		</div>
	);
}

export default BreadcrumbPath;
