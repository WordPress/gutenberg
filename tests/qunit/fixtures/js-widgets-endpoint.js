/* jshint -W109 */
/* jshint unused:false */
var jsWidgetsEndpointSchema =
{
    "namespace": "js-widgets\/v1",
    "routes": {
        "\/js-widgets\/v1": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "namespace": { "required": false, "default": "js-widgets\/v1" },
                    "context": { "required": false, "default": "view" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1" }
        },
        "\/js-widgets\/v1\/widgets\/pages": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "sortby": { "required": false, "default": "menu_order", "enum": ["post_title", "menu_order", "ID"], "description": "How to sort the pages.", "type": "string" },
                    "exclude": { "required": false, "default": [], "description": "Page IDs to exclude.", "type": ["array", "string"] }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/pages" }
        },
        "\/js-widgets\/v1\/widgets\/pages\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "sortby": { "required": false, "default": "menu_order", "enum": ["post_title", "menu_order", "ID"], "description": "How to sort the pages.", "type": "string" },
                    "exclude": { "required": false, "default": [], "description": "Page IDs to exclude.", "type": ["array", "string"] }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "sortby": { "required": false, "enum": ["post_title", "menu_order", "ID"], "description": "How to sort the pages.", "type": "string" },
                    "exclude": { "required": false, "description": "Page IDs to exclude.", "type": ["array", "string"] }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/calendar": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/calendar" }
        },
        "\/js-widgets\/v1\/widgets\/calendar\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/archives": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "default": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "default": false, "description": "Show post counts", "type": "boolean" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/archives" }
        },
        "\/js-widgets\/v1\/widgets\/archives\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "default": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "default": false, "description": "Show post counts", "type": "boolean" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "description": "Show post counts", "type": "boolean" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/meta": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/meta" }
        },
        "\/js-widgets\/v1\/widgets\/meta\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/search": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/search" }
        },
        "\/js-widgets\/v1\/widgets\/search\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/text": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "text": { "required": false, "description": "The content for the widget.", "type": ["string", "object"] },
                    "filter": { "required": false, "default": false, "description": "Whether paragraphs will be added for double line breaks (wpautop).", "type": "boolean" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/text" }
        },
        "\/js-widgets\/v1\/widgets\/text\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "text": { "required": false, "description": "The content for the widget.", "type": ["string", "object"] },
                    "filter": { "required": false, "default": false, "description": "Whether paragraphs will be added for double line breaks (wpautop).", "type": "boolean" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "text": { "required": false, "description": "The content for the widget.", "type": ["string", "object"] },
                    "filter": { "required": false, "description": "Whether paragraphs will be added for double line breaks (wpautop).", "type": "boolean" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/categories": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "default": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "default": false, "description": "Show post counts", "type": "boolean" },
                    "hierarchical": { "required": false, "default": false, "description": "Show hierarchy", "type": "boolean" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/categories" }
        },
        "\/js-widgets\/v1\/widgets\/categories\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "default": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "default": false, "description": "Show post counts", "type": "boolean" },
                    "hierarchical": { "required": false, "default": false, "description": "Show hierarchy", "type": "boolean" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "dropdown": { "required": false, "description": "Display as dropdown", "type": "boolean" },
                    "count": { "required": false, "description": "Show post counts", "type": "boolean" },
                    "hierarchical": { "required": false, "description": "Show hierarchy", "type": "boolean" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/recent-posts": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "default": 5, "description": "The number of posts to display.", "type": "integer" },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/recent-posts" }
        },
        "\/js-widgets\/v1\/widgets\/recent-posts\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "default": 5, "description": "The number of posts to display.", "type": "integer" },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "description": "The number of posts to display.", "type": "integer" },
                    "show_date": { "required": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/recent-comments": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "default": 5, "description": "The number of comments to display.", "type": "integer" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/recent-comments" }
        },
        "\/js-widgets\/v1\/widgets\/recent-comments\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "default": 5, "description": "The number of comments to display.", "type": "integer" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "number": { "required": false, "description": "The number of comments to display.", "type": "integer" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/rss": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "url": { "required": false, "default": "", "description": "The RSS feed URL.", "type": "string" },
                    "items": { "required": false, "default": 10, "description": "The number of RSS items to display.", "type": "integer" },
                    "show_summary": { "required": false, "default": false, "description": "Whether the summary should be shown.", "type": "boolean" },
                    "show_author": { "required": false, "default": false, "description": "Whether the author should be shown.", "type": "boolean" },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/rss" }
        },
        "\/js-widgets\/v1\/widgets\/rss\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "url": { "required": false, "default": "", "description": "The RSS feed URL.", "type": "string" },
                    "items": { "required": false, "default": 10, "description": "The number of RSS items to display.", "type": "integer" },
                    "show_summary": { "required": false, "default": false, "description": "Whether the summary should be shown.", "type": "boolean" },
                    "show_author": { "required": false, "default": false, "description": "Whether the author should be shown.", "type": "boolean" },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "url": { "required": false, "description": "The RSS feed URL.", "type": "string" },
                    "items": { "required": false, "description": "The number of RSS items to display.", "type": "integer" },
                    "show_summary": { "required": false, "description": "Whether the summary should be shown.", "type": "boolean" },
                    "show_author": { "required": false, "description": "Whether the author should be shown.", "type": "boolean" },
                    "show_date": { "required": false, "description": "Whether the date should be shown.", "type": "boolean" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/tag_cloud": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "taxonomy": { "required": false, "default": "post_tag", "enum": ["category", "post_tag"], "description": "Taxonomy", "type": "string" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/tag_cloud" }
        },
        "\/js-widgets\/v1\/widgets\/tag_cloud\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "taxonomy": { "required": false, "default": "post_tag", "enum": ["category", "post_tag"], "description": "Taxonomy", "type": "string" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "taxonomy": { "required": false, "enum": ["category", "post_tag"], "description": "Taxonomy", "type": "string" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/nav_menu": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "nav_menu": { "required": false, "default": 0, "description": "Selected nav menu", "type": "integer" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/nav_menu" }
        },
        "\/js-widgets\/v1\/widgets\/nav_menu\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "nav_menu": { "required": false, "default": 0, "description": "Selected nav menu", "type": "integer" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "nav_menu": { "required": false, "description": "Selected nav menu", "type": "integer" }
                }
            }]
        },
        "\/js-widgets\/v1\/widgets\/post-collection": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" },
                    "show_featured_image": { "required": false, "default": false, "description": "Whether the featured image is shown.", "type": "boolean" },
                    "show_author": { "required": false, "default": false, "description": "Whether the author is shown.", "type": "boolean" },
                    "posts": { "required": false, "default": [], "description": "The IDs for the collected posts.", "type": "array" }
                }
            }],
            "_links": { "self": "http:\/\/newtest.localhost\/wp-json\/js-widgets\/v1\/widgets\/post-collection" }
        },
        "\/js-widgets\/v1\/widgets\/post-collection\/(?P<widget_number>\\d+)": {
            "namespace": "js-widgets\/v1",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "endpoints": [{
                "methods": ["GET"],
                "args": {
                    "context": { "required": false, "default": "view", "enum": ["view", "embed", "edit"], "description": "Scope under which the request is made; determines fields present in response.", "type": "string" }
                }
            }, {
                "methods": ["POST", "PUT", "PATCH"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "show_date": { "required": false, "default": false, "description": "Whether the date should be shown.", "type": "boolean" },
                    "show_featured_image": { "required": false, "default": false, "description": "Whether the featured image is shown.", "type": "boolean" },
                    "show_author": { "required": false, "default": false, "description": "Whether the author is shown.", "type": "boolean" },
                    "posts": { "required": false, "default": [], "description": "The IDs for the collected posts.", "type": "array" }
                }
            }, {
                "methods": ["DELETE"],
                "args": {
                    "title": { "required": false, "description": "The title for the widget.", "type": ["string", "object"] },
                    "show_date": { "required": false, "description": "Whether the date should be shown.", "type": "boolean" },
                    "show_featured_image": { "required": false, "description": "Whether the featured image is shown.", "type": "boolean" },
                    "show_author": { "required": false, "description": "Whether the author is shown.", "type": "boolean" },
                    "posts": { "required": false, "description": "The IDs for the collected posts.", "type": "array" }
                }
            }]
        }
    },
    "_links": {
        "up": [
            { "href": "http:\/\/newtest.localhost\/wp-json\/" }
        ]
    }
};
