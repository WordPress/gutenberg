import { Link, Stack, Text } from '@wordpress/ui';

export function LibraryDescription() {
	return (
		<Stack direction="column" gap="lg">
			<Text render={ <p /> } style={ { margin: 0 } }>
				This library lists every icon in the{ ' ' }
				<code>@wordpress/icons</code> package. Some of them are also
				available through the Icons Registry API in WordPress.
			</Text>
			<Stack direction="column" gap="xs">
				<Text
					render={ <h3 /> }
					variant="heading-lg"
					style={ { margin: 0 } }
				>
					@wordpress/icons
				</Text>
				<Text render={ <p /> } style={ { margin: 0 } }>
					All icons are available. Import them from the npm package in
					JavaScript.{ ' ' }
					<Link
						href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-icons/#usage"
						openInNewTab
					>
						See the usage example
					</Link>
					.
				</Text>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text
					render={ <h3 /> }
					variant="heading-lg"
					style={ { margin: 0 } }
				>
					core collection
				</Text>
				<Text render={ <p /> } style={ { margin: 0 } }>
					These icons are registered in WordPress. Render them in PHP
					with{ ' ' }
					<Link
						href="https://developer.wordpress.org/reference/functions/wp_get_icon/"
						openInNewTab
					>
						wp_get_icon()
					</Link>
					. They are also available through the Icons REST API and in
					the Icon block.
				</Text>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text
					render={ <h3 /> }
					variant="heading-lg"
					style={ { margin: 0 } }
				>
					core-admin collection
				</Text>
				<Text render={ <p /> } style={ { margin: 0 } }>
					These icons are registered in WordPress for the admin
					interface. Render them in PHP with{ ' ' }
					<Link
						href="https://developer.wordpress.org/reference/functions/wp_get_icon/"
						openInNewTab
					>
						wp_get_icon()
					</Link>
					. They are not available through the Icons REST API or in
					the Icon block.
				</Text>
			</Stack>
		</Stack>
	);
}
