import { createInterpolateElement, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, Link, Popover, Stack, VisuallyHidden } from '@wordpress/ui';
import styles from './widget-header.module.css';

export interface WidgetInfotipProps {
	/**
	 * Names the popup; shown in it when `showTitle`.
	 */
	title: string;

	/**
	 * Show the title, for a header that clips it.
	 */
	showTitle?: boolean;

	/**
	 * Help content to display; may carry `<em>`/`<strong>`.
	 */
	content?: string;

	/**
	 * Links rendered after the content.
	 */
	links?: {
		label: string;
		href: string;
	}[];
}

/**
 * Header infotip: a hover- or click-open popover with the help note and, when
 * the header clips it, the full title. The ref reaches the trigger.
 */
export const WidgetInfotip = forwardRef<
	HTMLButtonElement,
	WidgetInfotipProps
>( function WidgetInfotip(
	{ title, showTitle = false, content, links },
	ref
): React.ReactNode {
	return (
		<Popover.Root modal="trap-focus">
			<Popover.Trigger
				ref={ ref }
				openOnHover
				delay={ 200 }
				closeDelay={ 200 }
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
				{ ! showTitle && (
					<VisuallyHidden render={ <Popover.Title /> }>
						{ title }
					</VisuallyHidden>
				) }

				<Stack direction="column" align="start" gap="sm">
					{ showTitle && <Popover.Title>{ title }</Popover.Title> }

					{ content && (
						<Popover.Description>
							{ createInterpolateElement( content, {
								em: <em />,
								strong: <strong />,
							} ) }
						</Popover.Description>
					) }

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
} );
