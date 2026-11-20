/**
 * Script module of the templates inside templates experiment:
 * `@wordpress/template-inheritance`.
 *
 * The data of its field is registered in PHP, by
 * `lib/experimental/block-template-parent.php`, which names this module, and
 * the client reads it from the `wp/v2/entity-fields` route. What cannot be
 * serialized (callbacks and components) is here: the client imports this
 * module on demand and merges each entry into the field with the same id.
 *
 * It is a package of its own, rather than part of `@wordpress/core-fields`,
 * which holds the fields core registers, so that package stays as core ships
 * it. This module is built and registered with every other one, and nothing
 * imports it while the experiment is off: only the PHP of the experiment
 * registers the field that names it.
 */

import { fieldExtensions as parentTemplate } from './parent-template/field';

const fields = {
	parent_template: parentTemplate,
};

export default fields;
