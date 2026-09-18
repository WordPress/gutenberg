/**
 * Where messages go. `console` satisfies it, and tests pass a silent stand-in.
 */
export interface Logger {
	log: ( message: string ) => void;
	error: ( message: string ) => void;
	warn?: ( message: string ) => void;
}

/**
 * A patch filename decoded back into the package it targets.
 */
export interface ParsedPatchName {
	packageName: string;
	version: string;
}

/**
 * What happened to a single patch, per installed copy.
 */
export type ApplyOutcome = 'applied' | 'skipped' | 'failed';

export type ApplyCounts = Record< ApplyOutcome, number >;

/**
 * Fetches and unpacks a published tarball, returning the unpacked directory.
 * Injectable so tests need no registry.
 */
export type FetchPristine = (
	packageName: string,
	version: string,
	destination: string
) => string;

export interface FindPackageOptions {
	rootDir: string;
	packageName: string;
	version?: string;
}

export interface ApplyPatchesOptions {
	rootDir: string;
	log?: Logger;
}

export interface ApplyToDirectoryOptions {
	rootDir: string;
	packageDir: string;
	packageName: string;
	patchContent: string;
	label: string;
	log: Logger;
}

export interface CreatePatchOptions {
	rootDir: string;
	packageName: string;
	fetchPristine?: FetchPristine;
	log?: Logger;
}

export interface CreatePatchResult {
	patchPath: string;
	written: boolean;
}

export interface MainOptions {
	rootDir?: string;
	log?: Logger;
}

/**
 * What `execFileSync` throws. Every field is optional, so a plain `Error`
 * satisfies it and no cast is needed to inspect a failure.
 */
export interface ExecFileError extends Error {
	status?: number | null;
	stdout?: Buffer | string;
	stderr?: Buffer | string;
}
