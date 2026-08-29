// When typeRoots is set in tsconfig, TypeScript only includes
// type definitions found in the specified directories.
// To ensure that global types are included, we need to
// explicitly reference them here.
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary types for tests that remain in Jest until the Browser Mode follow-up.
import '@wordpress/jest-console';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary types for tests that remain in Jest until the Browser Mode follow-up.
import 'snapshot-diff';
