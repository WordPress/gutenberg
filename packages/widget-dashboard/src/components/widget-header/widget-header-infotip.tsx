/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, Link, Popover, Stack, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './widget-header.module.css';

export interface WidgetInfotipProps {
	/**
	 * Help content to display; may carry `<em>`/`<strong>`.
	 */
	content: string;

	/**
	 * Links rendered after the content.
	 */
	links?: {
		label: string;
		href: string;
	}[];
}

/**
 * Header infotip: a click-open popover holding the widget type's help note.
 *
 * @param {WidgetInfotipProps} props Component props.
 */
export function WidgetInfotip( {
	content,
	links,
}: WidgetInfotipProps ): React.ReactNode {
	return (
		<Popover.Root modal="trap-focus">
			<Popover.Trigger
				aria-label={ __( 'More information' ) }
				className={ styles.help }
			>
				<Icon icon={ info } size={ 20 } />
			</Popover.Trigger>

			<Popover.Popup
				className={ styles[ 'popover-popup' ] }
				positioner={ <Popover.Positioner side="top" align="start" /> }
			>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>
					{ __( 'More information' ) }
				</VisuallyHidden>

				<Stack direction="column" align="start" gap="sm">
					<Popover.Description>
						{ createInterpolateElement( content, {
							em: <em />,
							strong: <strong />,
						} ) }
					</Popover.Description>

					{ links && links.length > 0 && (
						<Stack direction="row" align="start" gap="sm">
							{ links.map( ( link ) => (
								<Link
									key={ link.href }
									href={ link.href }
									className={ styles.link }
								>
									{ link.label }
								</Link>
							) ) }
						</Stack>
					) }
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
