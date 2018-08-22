// Hardcode hasUploadPermissions to true for now - in future this value will be
// correctly populated from application state.
// See github issue for more information:
// https://github.com/WordPress/gutenberg/issues/3672
export function MediaUploadCheck( { hasUploadPermissions = true, fallback, children } ) {
	const optionalFallback = fallback || null;
	return hasUploadPermissions ? children : optionalFallback;
}

export default MediaUploadCheck;
