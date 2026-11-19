package eg.driveprofit.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Fail closed on multiple fares/routes; never guess which offer is selected. */
final class OfferParser {

  private static final String N =
    "(?<![0-9.,])([0-9]{1,6}(?:[.,][0-9]{1,2})?)(?![0-9.,])";
  private static final String C = "(?:EGP|LE|جنيه(?:اً|ًا|ا)?|ج\\s*\\.\\s*م\\.?)";
  private static final Pattern DIST = Pattern.compile(
    N + "\\s*(?:km|كم|كيلومتر)(?![\\p{L}/])",
    Pattern.CASE_INSENSITIVE
  );
  private static final Pattern PRICE = Pattern.compile(
    "(?:" + N + "\\s*" + C + "|" + C + "\\s*" + N + ")",
    Pattern.CASE_INSENSITIVE
  );

  static double[] parse(String original) {
    StringBuilder s = new StringBuilder();
    for (char c : original.toCharArray()) {
      int digit = Character.digit(c, 10);
      s.append(digit >= 0 ? (char) ('0' + digit) : c == '٫' ? '.' : c);
    }
    if (s.indexOf("٬") >= 0) return null;
    Matcher d = DIST.matcher(s),
      p = PRICE.matcher(s);
    if (!d.find() || !p.find()) return null;
    double km = Double.parseDouble(d.group(1).replace(',', '.')),
      fare = Double.parseDouble(
        (p.group(1) != null ? p.group(1) : p.group(2)).replace(',', '.')
      );
    return km <= 0 || fare <= 0 || d.find() || p.find()
      ? null
      : new double[] { km, fare };
  }
}
