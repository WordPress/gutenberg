package org.wordpress.mobile;

import android.app.Activity;
import android.content.res.AssetManager;

import org.wordpress.android.util.AppLog;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class FileUtils {

    public static String getHtmlFromFile(Activity activity, String filename) {
        try {
            AssetManager assetManager = activity.getAssets();
            InputStream in = assetManager.open(filename);
            return getStringFromInputStream(in);
        } catch (IOException e) {
            AppLog.e(AppLog.T.EDITOR, "Unable to load editor HTML (is the assets symlink working?): " + e.getMessage());
            return null;
        }
    }

    public static String getStringFromInputStream(InputStream inputStream) throws IOException {
        InputStreamReader is = new InputStreamReader(inputStream);
        StringBuilder sb = new StringBuilder();
        BufferedReader br = new BufferedReader(is);
        String read = br.readLine();
        while (read != null) {
            sb.append(read);
            sb.append('\n');
            read = br.readLine();
        }
        return sb.toString();
    }

    public static List<String> getAssetFileList(Activity activity, String path) {
        ArrayList<String> pathList = new ArrayList<>();
        try {
            String [] list = activity.getAssets().list(path);
            for (String file : list) {
                pathList.add(path + "/" + file);
            }
        } catch (IOException e) {
            AppLog.e(AppLog.T.EDITOR, e);
        }
        return pathList;
    }
}
