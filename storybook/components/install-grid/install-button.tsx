import { ButtonLink } from '@wordpress/ui';

type InstallButtonProps = {
	href: string;
	children: string;
	/** Official badge image to show instead of the styled button. */
	image?: string;
};

/** A one-click install link for tools that offer a deeplink. */
export function InstallButton( { href, children, image }: InstallButtonProps ) {
	return (
		<p>
			{ image ? (
				<a href={ href }>
					<img src={ image } alt={ children } height={ 32 } />
				</a>
			) : (
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
			) }
		</p>
	);
}
