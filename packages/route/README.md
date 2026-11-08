# Route

Routing utilities for WordPress admin interfaces, providing a shared instance of TanStack Router.

## Installation

Install the module:

```bash
npm install @wordpress/route --save
```

## Usage

This package provides a shared instance of TanStack Router to ensure consistent routing across WordPress admin interfaces.

### Public API

The following hooks and components are available for use in routes:

```js
import { Link, useNavigate, useParams, useRouter, useSearch } from '@wordpress/route';

function MyRoute() {
	const params = useParams();
	const navigate = useNavigate();
	const search = useSearch();

	return (
		<div>
			<Link to="/other-route">Go to other route</Link>
			<button onClick={() => navigate({ to: '/somewhere' })}>
				Navigate
			</button>
		</div>
	);
}
```

### Private API

The boot package uses private APIs for router setup. These should not be used by individual routes.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose.

To find out more about contributing to this package or Gutenberg as a whole, please read the [project's main contributor guide](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
