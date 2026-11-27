import { ButtonLink } from '@wordpress/ui';

type InstallButtonProps = {
	href: string;
	children: string;
};

/** A one-click install link for tools that offer a deeplink. */
export function InstallButton( { href, children }: InstallButtonProps ) {
	return (
		<p>
			<ButtonLink
				// Storybook leaves `.sb-unstyled` links alone.
				className="sb-unstyled"
				href={ href }
				variant="solid"
				tone="brand"
				size="compact"
			>
				{ children }
			</ButtonLink>
		</p>
	);
}
