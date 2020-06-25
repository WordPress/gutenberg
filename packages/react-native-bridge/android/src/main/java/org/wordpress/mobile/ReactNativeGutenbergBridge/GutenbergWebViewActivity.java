package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.os.Handler;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.wordpress.android.util.AppLog;
import org.wordpress.android.util.helpers.WPWebChromeClient;
import org.wordpress.mobile.FileUtils;

import java.util.Locale;

public class GutenbergWebViewActivity extends AppCompatActivity {

    public static final String ARG_USER_ID = "authenticated_user_id";

    public static final String ARG_BLOCK_ID = "block_id";
    public static final String ARG_BLOCK_NAME = "block_name";
    public static final String ARG_BLOCK_CONTENT = "block_content";

    private static final String INJECT_LOCAL_STORAGE_SCRIPT_TEMPLATE = "localStorage.setItem('WP_DATA_USER_%d','%s')";
    private static final String INJECT_CSS_SCRIPT_TEMPLATE = "window.injectCss('%s')";
    private static final String INJECT_GET_HTML_POST_CONTENT_SCRIPT = "window.getHTMLPostContent();";
    private static final String JAVA_SCRIPT_INTERFACE_NAME = "wpwebkit";

    protected WebView mWebView;

    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gutenberg_web_view);

        setupToolbar();

        mWebView = findViewById(R.id.gutenberg_web_view);

        // Set settings
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptThirdPartyCookies(mWebView, true);

        // Add javascript interface
        mWebView.addJavascriptInterface(new WPWebKit(), JAVA_SCRIPT_INTERFACE_NAME);

        // Setup WebView client
        setupWebViewClient();
        mWebView.setWebChromeClient(new WPWebChromeClient(null, findViewById(R.id.progress_bar)));

        loadUrl();
    }

    protected void loadUrl() {
        mWebView.loadUrl("https://wordpress.org/gutenberg/");
    }

    private void setupToolbar() {
        setTitle("");

        Toolbar toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) {
            setSupportActionBar(toolbar);

            ActionBar actionBar = getSupportActionBar();
            if (actionBar != null) {
                actionBar.setDisplayShowTitleEnabled(true);
                actionBar.setDisplayHomeAsUpEnabled(true);
                actionBar.setHomeAsUpIndicator(R.drawable.ic_close_24px);
                actionBar.setSubtitle("");
                actionBar.setTitle(getToolbarTitle());
            }
        }
    }

    protected String getToolbarTitle() {
        String blockName = getIntent().getExtras().getString(ARG_BLOCK_NAME);
        if (blockName != null) {
            return String.format("Edit %s block", blockName);
        }
        return "";
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);

        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_gutenberg_webview, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(final MenuItem item) {
        if (mWebView == null) {
            return false;
        }

        int itemID = item.getItemId();

        if (itemID == android.R.id.home) {
            finish();
        } else if (itemID == R.id.menu_save) {
            saveAction();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void saveAction() {
        mWebView.clearFocus();
        mWebView.evaluateJavascript(INJECT_GET_HTML_POST_CONTENT_SCRIPT,
                value -> AppLog.e(AppLog.T.EDITOR, value));
    }

    protected void saveContent(String content) {
        String blockId = getIntent().getExtras().getString(ARG_BLOCK_ID);
        AppLog.i(AppLog.T.EDITOR, String.format(Locale.US, "Save block id %s, with content %s", blockId, content));
        ((GutenbergBridgeInterface)getApplication()).saveContent(content, blockId);
        finish();
    }

    private String getFileContentFromAssets(String assetsFileName) {
        return FileUtils.getHtmlFromFile(this, assetsFileName);
    }

    private String removeNewLines(String content) {
        return content.replace("\r\n", " ").replace("\n", " ");
    }

    private String removeWhiteSpace(String content) {
        return content.replaceAll("\\s+", "");
    }

    private void setupWebViewClient() {
        mWebView.setWebViewClient(new WebViewClient() {
            private boolean mIsRedirected;

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Set if page is redirected
                if (!mIsRedirected) {
                    mIsRedirected = true;
                }

                return super.shouldOverrideUrlLoading(view, url);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {

                String injectCssScript = getFileContentFromAssets("gutenberg-web-single-block/inject-css.js");
                evaluateJavaScript(injectCssScript);

                long userId = getIntent().getExtras().getLong(ARG_USER_ID, 0);
                if (userId != 0) {
                    String injectLocalStorageScript = getFileContentFromAssets("gutenberg-web-single-block/local-storage-overrides.json");
                    injectLocalStorageScript = removeWhiteSpace(removeNewLines(injectLocalStorageScript));

                    evaluateJavaScript(
                            String.format(
                                    Locale.US,
                                    INJECT_LOCAL_STORAGE_SCRIPT_TEMPLATE,
                                    userId,
                                    injectLocalStorageScript)
                    );
                }

                super.onPageCommitVisible(view, url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                if (mIsRedirected) {
                    mIsRedirected = false;
                    return;
                }

                String contentFunctions = getFileContentFromAssets("gutenberg-web-single-block/content-functions.js");
                evaluateJavaScript(contentFunctions);

                String editorStyle = getFileContentFromAssets("gutenberg-web-single-block/editor-style-overrides.css");
                editorStyle = removeWhiteSpace(removeNewLines(editorStyle));
                evaluateJavaScript(String.format(INJECT_CSS_SCRIPT_TEMPLATE, editorStyle));

                String injectWPBarsCssScript = getFileContentFromAssets("gutenberg-web-single-block/wp-bar-override.css");
                injectWPBarsCssScript = removeWhiteSpace(removeNewLines(injectWPBarsCssScript));
                evaluateJavaScript(String.format(INJECT_CSS_SCRIPT_TEMPLATE, injectWPBarsCssScript));

                final Handler handler = new Handler();
                handler.postDelayed(() -> {
                    String preventAutosaves = getFileContentFromAssets("gutenberg-web-single-block/prevent-autosaves.js");
                    evaluateJavaScript(preventAutosaves);

                    String insertBlock = getFileContentFromAssets("gutenberg-web-single-block/insert-block.js").replace("%@","%s");
                    String blockContent = getIntent().getExtras().getString(ARG_BLOCK_CONTENT);
                    insertBlock = String.format(insertBlock, blockContent);
                    evaluateJavaScript(removeNewLines(insertBlock));

                    view.setVisibility(View.VISIBLE);
                }, 2000);
            }

            private void evaluateJavaScript(String script) {
                mWebView.evaluateJavascript(script, value ->
                        AppLog.e(AppLog.T.EDITOR, value));
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void finish() {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                mWebView.removeJavascriptInterface(JAVA_SCRIPT_INTERFACE_NAME);
                mWebView.clearHistory();
                mWebView.clearFormData();
                mWebView.clearCache(true);
            }
        });

        super.finish();
    }

    public class WPWebKit {
        @JavascriptInterface
        public void postMessage(String content) {
            if (content != null && content.length() > 0) {
                saveContent(content);
            }
        }
    }
}
