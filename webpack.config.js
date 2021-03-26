const {
    BundleAnalyzerPlugin: BundleAnalyzerPlugin
} = require("webpack-bundle-analyzer"), {
    DefinePlugin: DefinePlugin
} = require("webpack"), CopyWebpackPlugin = require("copy-webpack-plugin"), TerserPlugin = require("terser-webpack-plugin"), postcss = require("postcss"), {
    get: get,
    escapeRegExp: escapeRegExp,
    compact: compact
} = require("lodash"), {
    basename: basename,
    sep: sep
} = require("path"), CustomTemplatedPathPlugin = require("@wordpress/custom-templated-path-webpack-plugin"), LibraryExportDefaultPlugin = require("@wordpress/library-export-default-webpack-plugin"), DependencyExtractionWebpackPlugin = require("@wordpress/dependency-extraction-webpack-plugin"), {
    camelCaseDash: camelCaseDash
} = require("@wordpress/dependency-extraction-webpack-plugin/lib/util"), {
    dependencies: dependencies
} = require("./package"), {
    NODE_ENV: mode = "development",
    WP_DEVTOOL: devtool = "production" !== mode && "source-map"
} = process.env, WORDPRESS_NAMESPACE = "@wordpress/", BUNDLED_PACKAGES = ["@wordpress/icons", "@wordpress/interface"], gutenbergPackages = Object.keys(dependencies).filter(e => !BUNDLED_PACKAGES.includes(e) && e.startsWith("@wordpress/") && !e.startsWith("@wordpress/react-native")).map(e => e.replace("@wordpress/", "")), stylesTransform = e => "production" === mode ? postcss([require("cssnano")({
    preset: ["default", {
        discardComments: {
            removeAll: !0
        }
    }]
})]).process(e, {
    from: "src/app.css",
    to: "dest/app.css"
}).then(e => e.css) : e;
module.exports = {
    optimization: {
        concatenateModules: "production" === mode && !process.env.WP_BUNDLE_ANALYZER,
        minimizer: [new TerserPlugin({
            cache: !0,
            parallel: !0,
            sourceMap: "production" !== mode,
            terserOptions: {
                output: {
                    comments: /translators:/i
                },
                compress: {
                    passes: 2
                },
                mangle: {
                    reserved: ["__", "_n", "_nx", "_x"]
                }
            },
            extractComments: !1
        })]
    },
    mode: mode,
    entry: gutenbergPackages.reduce((e, s) => {
        return e[camelCaseDash(s)] = `./packages/${s}`, e
    }, {}),
    output: {
        devtoolNamespace: "wp",
        filename: "./build/[basename]/index.js",
        path: __dirname,
        library: ["wp", "[name]"],
        libraryTarget: "window"
    },
    module: {
        rules: compact(["production" !== mode && {
            test: /\.js$/,
            use: require.resolve("source-map-loader"),
            enforce: "pre"
        }])
    },
    plugins: [process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin, new DefinePlugin({
        "process.env.GUTENBERG_PHASE": JSON.stringify(parseInt(process.env.npm_package_config_GUTENBERG_PHASE, 10) || 1),
        "process.env.COMPONENT_SYSTEM_PHASE": JSON.stringify(parseInt(process.env.npm_package_config_COMPONENT_SYSTEM_PHASE, 10) || 0),
        "process.env.FORCE_REDUCED_MOTION": JSON.stringify(process.env.FORCE_REDUCED_MOTION)
    }), new CustomTemplatedPathPlugin({
        basename(e, s) {
            let r;
            const t = get(s, ["chunk", "entryModule"], {});
            switch (t.type) {
                case "javascript/auto":
                    r = t.rawRequest;
                    break;
                case "javascript/esm":
                    r = t.rootModule.rawRequest
            }
            return r ? basename(r) : e
        }
    }), new LibraryExportDefaultPlugin(["api-fetch", "deprecated", "dom-ready", "redux-routine", "token-list", "server-side-render", "shortcode", "warning"].map(camelCaseDash)), new CopyWebpackPlugin(gutenbergPackages.map(e => ({
        from: `./packages/${e}/build-style/*.css`,
        to: `./build/${e}/`,
        flatten: !0,
        transform: stylesTransform
    }))), new CopyWebpackPlugin([{
        from: "./packages/block-library/build-style/*/style.css",
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}style\\.css$`),
        to: "build/block-library/blocks/[1]/style.css",
        transform: stylesTransform
    }, {
        from: "./packages/block-library/build-style/*/style-rtl.css",
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}style-rtl\\.css$`),
        to: "build/block-library/blocks/[1]/style-rtl.css",
        transform: stylesTransform
    }, {
        from: "./packages/block-library/build-style/*/editor.css",
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}editor\\.css$`),
        to: "build/block-library/blocks/[1]/editor.css",
        transform: stylesTransform
    }, {
        from: "./packages/block-library/build-style/*/editor-rtl.css",
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}editor-rtl\\.css$`),
        to: "build/block-library/blocks/[1]/editor-rtl.css",
        transform: stylesTransform
    }]), new CopyWebpackPlugin(Object.entries({
        "./packages/block-library/src/": "build/block-library/blocks/",
        "./packages/edit-widgets/src/blocks/": "build/edit-widgets/blocks/"
    }).flatMap(([e, s]) => [{
        from: `${e}/**/index.php`,
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}index\\.php$`),
        to: `${s}/[1].php`,
        transform: e => (e = e.toString()).match(/^function [^\(]+/gm).reduce((e, s) => (s = s.slice(9), e.replace(new RegExp(s, "g"), e => "gutenberg_" + e.replace(/^wp_/, ""))), e).replace(/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/, "$1, 20")
    }, {
        from: `${e}/*/block.json`,
        test: new RegExp(`([\\w-]+)${escapeRegExp(sep)}block\\.json$`),
        to: `${s}/[1]/block.json`
    }])), new DependencyExtractionWebpackPlugin({
        injectPolyfill: !0
    })].filter(Boolean),
    watchOptions: {
        ignored: "!packages/*/!(src)/**/*",
        aggregateTimeout: 500
    },
    devtool: devtool
};
