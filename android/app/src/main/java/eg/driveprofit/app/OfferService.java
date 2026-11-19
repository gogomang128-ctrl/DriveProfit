package eg.driveprofit.app;

import android.accessibilityservice.AccessibilityService;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.view.*;
import android.view.accessibility.*;
import android.widget.TextView;
import java.util.Locale;
import org.json.JSONObject;

/** Only inspect visible text in the allowlisted app. No screenshots, logs, storage or actions. */
public class OfferService extends AccessibilityService {

  private static final String APP = "sinet.startup.inDriver";
  private final Handler handler = new Handler(Looper.getMainLooper());
  private TextView bubble;
  private final Runnable expire = this::hide;
  private int remaining;

  private void collect(AccessibilityNodeInfo n, StringBuilder text, int depth) {
    if (
      n == null ||
      depth > 20 ||
      remaining-- <= 0 ||
      text.length() > 12000 ||
      n.isPassword()
    ) return;
    if (n.isVisibleToUser()) {
      CharSequence t = n.getText();
      if (t == null) t = n.getContentDescription();
      if (t != null && t.length() < 300) text.append(t).append('\n');
    }
    for (int i = 0; i < n.getChildCount() && remaining > 0; i++) {
      AccessibilityNodeInfo child = n.getChild(i);
      if (child != null) {
        collect(child, text, depth + 1);
        child.recycle();
      }
    }
  }

  @Override
  public void onAccessibilityEvent(AccessibilityEvent e) {
    if (e == null || !APP.contentEquals(String.valueOf(e.getPackageName()))) {
      hide();
      return;
    }
    AccessibilityNodeInfo root = getRootInActiveWindow();
    if (root == null) {
      hide();
      return;
    }
    try {
      if (!APP.contentEquals(String.valueOf(root.getPackageName()))) {
        hide();
        return;
      }
      StringBuilder text = new StringBuilder();
      remaining = 220;
      collect(root, text, 0);
      double[] offer = OfferParser.parse(text.toString());
      if (offer == null) {
        hide();
        return;
      }
      JSONObject s = new JSONObject(
        getSharedPreferences("driver", MODE_PRIVATE).getString("settings", "{}")
      );
      double price = s.getJSONObject("prices").getDouble(s.getString("grade"));
      double net =
        offer[1] * (1 - s.getDouble("wear") / 100) -
        (offer[0] * s.getDouble("rate") * price) / 100;
      show(
        String.format(
          Locale.US,
          "DriveProfit  ·  %s %.2f ج.م\n%.1f كم  /  %.2f ج.م",
          net < 0 ? "خسارة" : "ربح",
          Math.abs(net),
          offer[0],
          offer[1]
        ),
        net < 0
      );
    } catch (Exception ignored) {
      hide();
    } finally {
      root.recycle();
    }
  }

  private void show(String text, boolean loss) {
    if (bubble == null) {
      bubble = new TextView(this);
      bubble.setPadding(24, 12, 24, 12);
      bubble.setTextSize(14);
      bubble.setOnClickListener(v -> hide());
      bubble.setContentDescription("صافي الربح المتوقع، اضغط للإخفاء");
      WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
        -2,
        -2,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
          WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
        PixelFormat.TRANSLUCENT
      );
      lp.gravity = Gravity.TOP | Gravity.END;
      lp.y = (int) (70 * getResources().getDisplayMetrics().density);
      getSystemService(WindowManager.class).addView(bubble, lp);
    }
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(0xf0212720);
    bg.setCornerRadius(18);
    bubble.setBackground(bg);
    bubble.setTextColor(loss ? 0xffffab91 : 0xffb6ec50);
    bubble.setText(text);
    handler.removeCallbacks(expire);
    handler.postDelayed(expire, 8000);
  }

  private void hide() {
    handler.removeCallbacks(expire);
    if (bubble != null) {
      if (bubble.isAttachedToWindow()) getSystemService(
        WindowManager.class
      ).removeView(bubble);
      bubble = null;
    }
  }

  @Override
  public void onInterrupt() {
    hide();
  }

  @Override
  public void onDestroy() {
    hide();
    super.onDestroy();
  }
}
