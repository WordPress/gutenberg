import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';

/**
 * One entry in the menu. Deliberately not a category: "Media library" stands
 * for the `images`, `videos` and `audio` categories together, which the tab
 * offers as media-type tabs, while every other source maps to a single
 * registered `InserterMediaCategory`.
 */
export type MediaSource = {
	name: string;
	label: string;
};

/**
 * Picks which source the tab browses: the media library, the post's attached
 * images, or any other registered category such as Openverse.
 */
export default function SourceMenu( {
	sources,
	value,
	onChange,
}: {
	sources: MediaSource[];
	value: string;
	onChange: ( name: string ) => void;
} ) {
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						__next40pxDefaultSize
						icon={ settings }
						label={ __( 'Media source' ) }
					/>
				}
			/>
			<Menu.Popup>
				<Menu.RadioGroup
					value={ value }
					onValueChange={ ( next: string ) => onChange( next ) }
				>
					{ sources.map( ( source ) => (
						<Menu.RadioItem
							key={ source.name }
							value={ source.name }
							closeOnClick
						>
							<Menu.ItemLabel>{ source.label }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}
