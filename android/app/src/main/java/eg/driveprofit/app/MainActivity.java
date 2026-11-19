package eg.driveprofit.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle state) {
    registerPlugin(DriverPlugin.class);
    super.onCreate(state);
  }
}
