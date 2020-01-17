package org.wordpress.mobile.WPAndroidGlue;

import android.text.TextUtils;

import org.wordpress.mobile.WPAndroidGlue.WPAndroidGlueCode.OnAuthHeaderRequestedListener;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class OkHttpHeaderInterceptor implements Interceptor {
    private static final String AUTHORIZATION_HEADER_KEY = "Authorization";

    private OnAuthHeaderRequestedListener mOnAuthHeaderRequestedListener;

    void setOnAuthHeaderRequestedListener(OnAuthHeaderRequestedListener onAuthHeaderRequestedListener) {
        mOnAuthHeaderRequestedListener = onAuthHeaderRequestedListener;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request.Builder builder = chain.request().newBuilder();

        String authHeader = mOnAuthHeaderRequestedListener != null
                ? mOnAuthHeaderRequestedListener.onAuthHeaderRequested(chain.request().url().toString()) : null;
        if (!TextUtils.isEmpty(authHeader)) {
            builder.addHeader(AUTHORIZATION_HEADER_KEY, authHeader);
        }

        return chain.proceed(builder.build());
    }
}
