import { Icon } from '@wordpress/icons';
import { Badge, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { CopySvgButton } from './copy-svg-button';
import { LibraryDescription } from './library-description';
import {
	ALL_ICONS_MANIFEST,
	COLLECTIONS,
	availableIcons,
	nameToSlug,
} from './manifest';

export function IconDetails( { name }: { name: string } ) {
	const icon = availableIcons[ name as keyof typeof availableIcons ];
	const slug = nameToSlug( name );
	const iconInfo = ALL_ICONS_MANIFEST.get( slug );
	const collections = iconInfo?.collections ?? [];

	return (
		<Stack direction="column" gap="2xl" align="flex-start">
			<Stack direction="row" gap="xl" align="center">
				<Icon icon={ icon } size={ 128 } />
				<Stack direction="column" gap="md" align="flex-start">
					<Text
						render={ <h2 /> }
						variant="heading-xl"
						style={ { margin: 0 } }
					>
						{ iconInfo?.label ?? name }
					</Text>
					<code>{ slug }</code>
					<CopySvgButton icon={ icon } />
				</Stack>
			</Stack>
			<Stack direction="column" gap="sm" align="flex-start">
				<Text variant="body-sm">Available in</Text>
				<Stack
					render={ <ul /> }
					direction="row"
					gap="sm"
					wrap="wrap"
					style={ { margin: 0, padding: 0, listStyle: 'none' } }
				>
					{ COLLECTIONS.map( ( { value, label } ) => {
						const isAvailable =
							value === 'all' || collections.includes( value );
						return (
							<li key={ value }>
								<Badge
									intent={ isAvailable ? 'stable' : 'none' }
									style={
										isAvailable
											? undefined
											: { opacity: 0.5 }
									}
								>
									{ label }
								</Badge>
								{ ! isAvailable && (
									<VisuallyHidden>
										(not available)
									</VisuallyHidden>
								) }
							</li>
						);
					} ) }
				</Stack>
			</Stack>
			<LibraryDescription />
		</Stack>
	);
}
