// Client-zip is meant to be used in a browser and is therefore released as an ES6 module only,
// in order for the native build to succeed we are importing a null action and avoiding importing
// the non working in native context client-zip module.
export const exportPatternAsJSONAction = null;
