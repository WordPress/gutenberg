/**
 * Internal dependencies
 */
import { styleProps } from './card.styles';

const { backgroundShady } = styleProps;

export function bodySize() {
	return `
		&.is-size {
			&-lg {
				padding: 28px;
			}
			&-md {
				padding: 20px;
			}
			&-sm {
				padding: 12px;
			}
			&-xs {
				padding: 8px;
			}
		}
	`;
}

export function headerFooterSizes() {
	return `
		&.is-size {
			&-lg {
				padding: 20px 28px;
			}
			&-md {
				padding: 12px 20px;
			}
			&-sm {
				padding: 8px 12px;
			}
			&-xs {
				padding: 4px 8px;
			}
		}
	`;
}

export function handleBorderless() {
	return `
		&.is-variant {
			&-borderless {
				border: none;
			}

			&-raised {
				border: none;
			}
		}
	`;
}

export function handleShady() {
	return `
		&.is-shady {
			background: ${ backgroundShady };
		}
	`;
}
