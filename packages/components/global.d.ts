// When typeRoots is set in tsconfig, TypeScript only includes
// type definitions found in the specified directories.
// To ensure that global types are included, we need to
// explicitly reference them here.
import '@testing-library/jest-dom';
import '@wordpress/jest-console';
import 'snapshot-diff';
